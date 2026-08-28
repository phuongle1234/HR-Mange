import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Invitation } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AppConfig } from '../../../config/configuration';
import { BaseService } from '../../../common/services/base.service';
import { PaginatedResult } from '../../../common/interfaces/base.interface';
import { InvitationNotFoundException } from '../../../common/exceptions/app.exception';
import { generateInvitationToken, hashInvitationToken } from '../utils/invitation-token.util';
import { INVITATION_CREATED_EVENT, InvitationCreatedEvent } from '../events/invitation-created.event';
import { GetInvitationsQueryDto } from '../dto/get-invitations-query.dto';
import {
  CreateInvitationsResult,
  IInvitationsService,
  InvitationCreatedResult,
  InvitationSkippedResult,
} from '../interfaces/invitations-service.interface';

const INVITATION_TTL_HOURS = 72;

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
 * Prisma -> PostgreSQL. All row writes go through inherited BaseService
 * methods via `this.createMany(...)` / `this.update(...)` - this service
 * never touches `this.prisma.invitation` directly.
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
}
