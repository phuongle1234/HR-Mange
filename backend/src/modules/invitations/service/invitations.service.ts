import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { AppConfig } from '../../../config/configuration';
import { AuditEntityType } from '../../../common/constants/audit-action.constant';
import { ENTITY_CREATED_EVENT, EntityCrudEvent } from '../../../common/events/entity-crud.event';
import { generateInvitationToken, hashInvitationToken } from '../utils/invitation-token.util';
import { INVITATION_CREATED_EVENT, InvitationCreatedEvent } from '../events/invitation-created.event';
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
 * Deliberately does not extend BaseService - this needs a per-row token
 * side effect plus a partitioned created/skipped response shape that
 * BaseService's uniform "return the created rows" contract does not fit
 * (see API-INVITATIONS-CREATE's Database Interaction section).
 */
@Injectable()
export class InvitationsService implements IInvitationsService {
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService<AppConfig>,
  ) {
    this.frontendUrl = configService.get('app.frontendUrl', { infer: true });
  }

  async createMany(employeeIds: string[], actorUserId: string): Promise<CreateInvitationsResult> {
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

    const created: InvitationCreatedResult[] = [];
    if (pending.length > 0) {
      const rows = await this.prisma.$transaction(
        pending.map((row) =>
          this.prisma.invitation.create({
            data: {
              employeeId: row.employeeId,
              email: row.email,
              tokenHash: row.tokenHash,
              expiresAt: row.expiresAt,
            },
          }),
        ),
      );

      rows.forEach((invitation, index) => {
        created.push({ employeeId: invitation.employeeId, invitationId: invitation.id });

        // Audit trail for the invitation row itself, distinct from the
        // mail-trigger event below - never carries the raw token/URL.
        this.eventEmitter.emit(
          ENTITY_CREATED_EVENT,
          new EntityCrudEvent(
            AuditEntityType.INVITATION,
            invitation.id,
            { employeeId: invitation.employeeId, email: invitation.email, expiresAt: invitation.expiresAt },
            actorUserId,
            new Date(),
          ),
        );

        const pendingRow = pending[index];
        this.eventEmitter.emit(
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
    }

    return { created, skipped };
  }
}
