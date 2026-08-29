import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Invitation } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AppConfig } from '../../../config/configuration';
import { BaseService } from '../../../common/services/base.service';
import { PaginatedResult } from '../../../common/interfaces/base.interface';
import {
  InvitationAlreadyAcceptedException,
  InvitationExpiredException,
  InvitationNotFoundException,
  InvitationTokenInvalidException,
  PasswordPolicyFailedException,
  UserAlreadyExistsException,
  ValidationException,
} from '../../../common/exceptions/app.exception';
import { satisfiesPasswordPolicy } from '../../../common/utils/password-policy.util';
import { generateInvitationToken, hashInvitationToken } from '../utils/invitation-token.util';
import { INVITATION_CREATED_EVENT, InvitationCreatedEvent } from '../events/invitation-created.event';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { GetInvitationsQueryDto } from '../dto/get-invitations-query.dto';
import {
  CreateInvitationsResult,
  IInvitationsService,
  InvitationCreatedResult,
  InvitationSkippedResult,
} from '../interfaces/invitations-service.interface';

const INVITATION_TTL_HOURS = 72;

/** Same cost factor AuthService uses, so hashes stay consistent across the app. */
const BCRYPT_SALT_ROUNDS = 10;

interface PendingInvitationRow {
  employeeId: string;
  email: string;
  employeeName: string;
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Follows the mandatory backend flow (AGENTS.md Backend Rules):
 * Controller -> IInvitationsService -> InvitationsService -> BaseService ->
 * Prisma -> PostgreSQL. Single-row writes go through inherited BaseService
 * methods via `this.createMany(...)` / `this.update(...)`.
 *
 * `acceptInvitation` is the one exception: it writes User + Employee +
 * Invitation atomically, which spans three delegates and so cannot be
 * expressed by any inherited base method (BaseService holds exactly one
 * delegate). It uses `prisma.$transaction` for that write only - the same
 * sanctioned narrow exception the workflow action engine uses.
 *
 * Audit eventing is opted out (`entityType: null` in the super call): the
 * Invitation lifecycle is tracked by this module's own
 * `invitation.created` domain event plus the row's own status/sentAt/
 * sendAttempts columns, and an Invitation row is created together with a
 * one-time token whose URL must never reach the shared audit log. See
 * BaseService's class doc for what opting out changes (only whether
 * entity.created/updated/deleted is emitted - nothing else).
 *
 * `prisma` is still injected, but only for the cross-entity Employee read
 * that decides which employees are eligible (BaseService is scoped to one
 * delegate - the Invitation delegate - by design and cannot read Employee).
 */
@Injectable()
export class InvitationsService
  extends BaseService<PrismaService['invitation'], GetInvitationsQueryDto>
  implements IInvitationsService
{
  private readonly frontendUrl: string;

  /**
   * `invitationEvents` is this module's own domain-event emitter reference,
   * named distinctly from BaseService's private `eventEmitter` (a private
   * member of the same name in both classes is a TS conflict). BaseService's
   * copy is unused here anyway - audit eventing is opted out via
   * `entityType: null`.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationEvents: EventEmitter2,
    configService: ConfigService<AppConfig>,
  ) {
    super(prisma.invitation, invitationEvents, null, (id) => new InvitationNotFoundException(id));
    this.frontendUrl = configService.get('app.frontendUrl', { infer: true });
  }

  async findMany(query?: GetInvitationsQueryDto): Promise<PaginatedResult<Invitation>> {
    const where = {
      ...(query?.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query?.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.entity.findMany({ where, orderBy: { createdAt: 'desc' } }),
      this.entity.count({ where }),
    ]);

    return { items, total };
  }

  async createInvitations(employeeIds: string[], actorUserId: string): Promise<CreateInvitationsResult> {
    const employees = await this.prisma.employee.findMany({ where: { id: { in: employeeIds } } });
    const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

    const skipped: InvitationSkippedResult[] = [];
    const pending: PendingInvitationRow[] = [];

    for (const employeeId of employeeIds) {
      const employee = employeeById.get(employeeId);
      if (!employee) {
        skipped.push({ employeeId, reason: 'EMPLOYEE_NOT_FOUND' });
        continue;
      }
      if (employee.userId) {
        skipped.push({ employeeId, reason: 'USER_ALREADY_EXISTS' });
        continue;
      }
      if (!employee.email) {
        skipped.push({ employeeId, reason: 'EMPLOYEE_MISSING_EMAIL' });
        continue;
      }

      const rawToken = generateInvitationToken();
      pending.push({
        employeeId,
        email: employee.email,
        employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
        rawToken,
        tokenHash: hashInvitationToken(rawToken),
        expiresAt: new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000),
      });
    }

    if (pending.length === 0) return { created: [], skipped };

    const rows = await this.createMany(
      pending.map((row) => ({
        employeeId: row.employeeId,
        email: row.email,
        tokenHash: row.tokenHash,
        expiresAt: row.expiresAt,
      })),
      actorUserId,
    );

    const created: InvitationCreatedResult[] = [];
    rows.forEach((invitation, index) => {
      created.push({ employeeId: invitation.employeeId, invitationId: invitation.id });

      const pendingRow = pending[index];
      this.invitationEvents.emit(
        INVITATION_CREATED_EVENT,
        new InvitationCreatedEvent(
          invitation.id,
          invitation.employeeId,
          invitation.email,
          pendingRow.employeeName,
          `${this.frontendUrl}/invitation/accept?token=${pendingRow.rawToken}`,
          invitation.expiresAt,
        ),
      );
    });

    return { created, skipped };
  }

  async markSent(invitationId: string): Promise<void> {
    await this.update(invitationId, { status: 'SENT', sentAt: new Date(), sendAttempts: { increment: 1 } });
  }

  async markSendFailed(invitationId: string, errorMessage: string): Promise<void> {
    await this.update(invitationId, {
      status: 'SEND_FAILED',
      sendAttempts: { increment: 1 },
      lastSendError: errorMessage,
    });
  }

  /**
   * Redeems an invitation (API-AUTH-INVITATIONS-ACCEPT).
   *
   * The raw token is never stored, so it is hashed with the same function used
   * at creation time and matched against `tokenHash`.
   *
   * The three writes must be atomic: a User created without its Employee link
   * would be an account nobody can act as, and an Employee linked to a User
   * without the invitation being closed would let the same token be redeemed
   * twice.
   */
  async acceptInvitation(dto: AcceptInvitationDto): Promise<void> {
    if (dto.password !== dto.confirmPassword) {
      throw new ValidationException({ confirmPassword: ['confirmPassword must match password.'] });
    }
    if (!satisfiesPasswordPolicy(dto.password)) {
      throw new PasswordPolicyFailedException();
    }

    const invitation = await this.entity.findUnique({ where: { tokenHash: hashInvitationToken(dto.token) } });
    // Deliberately generic: never reveal whether a token merely expired or
    // never existed, so the endpoint cannot be used to probe for valid tokens.
    if (!invitation) throw new InvitationTokenInvalidException();
    if (invitation.status === 'ACCEPTED') throw new InvitationAlreadyAcceptedException();

    // Checked on read: no background job writes status EXPIRED in this phase,
    // so a still-PENDING row past its expiry is expired all the same.
    if (invitation.expiresAt.getTime() < Date.now()) throw new InvitationExpiredException();

    const employee = await this.prisma.employee.findUnique({ where: { id: invitation.employeeId } });
    if (!employee) throw new InvitationTokenInvalidException();
    if (employee.userId) throw new UserAlreadyExistsException();

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const fullName = `${employee.firstName} ${employee.lastName}`.trim();

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: invitation.email, passwordHash, fullName, isActive: true },
      });

      // This is the only place employees.user_id is ever set.
      await tx.employee.update({ where: { id: employee.id }, data: { userId: user.id } });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
    });
  }
}
