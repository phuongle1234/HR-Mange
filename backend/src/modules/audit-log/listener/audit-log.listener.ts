import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLogRepository } from '../repository/audit-log.repository';
import { AuditAction, AuditEntityType } from '../../../common/constants/audit-action.constant';
import {
  ENTITY_CREATED_EVENT,
  ENTITY_DELETED_EVENT,
  ENTITY_UPDATED_EVENT,
  EntityCrudEvent,
} from '../../../common/events/entity-crud.event';

const AUDIT_ACTION_BY_ENTITY: Record<
  AuditEntityType,
  { created: AuditAction; updated: AuditAction; deleted: AuditAction }
> = {
  [AuditEntityType.EMPLOYEE]: {
    created: AuditAction.EMPLOYEE_CREATED,
    updated: AuditAction.EMPLOYEE_UPDATED,
    deleted: AuditAction.EMPLOYEE_DELETED,
  },
  [AuditEntityType.ORGANIZATION]: {
    created: AuditAction.ORGANIZATION_CREATED,
    updated: AuditAction.ORGANIZATION_UPDATED,
    deleted: AuditAction.ORGANIZATION_DELETED,
  },
  [AuditEntityType.ORGANIZATION_TYPE]: {
    created: AuditAction.ORGANIZATION_TYPE_CREATED,
    updated: AuditAction.ORGANIZATION_TYPE_UPDATED,
    deleted: AuditAction.ORGANIZATION_TYPE_DELETED,
  },
  [AuditEntityType.INVITATION]: {
    created: AuditAction.INVITATION_CREATED,
    updated: AuditAction.INVITATION_UPDATED,
    deleted: AuditAction.INVITATION_DELETED,
  },
};

/**
 * Subscribes to the generic CRUD events every BaseService emits *after* the
 * triggering mutation has already committed (docs/02-solution/event-driven.md:
 * "Event publishing should happen after successful persistence"). Because of
 * that ordering, a failed audit write must never be rolled back into the
 * original operation - it is logged loudly instead (WORK-011). One set of
 * handlers covers every entity; adding a new entity to BaseService only
 * requires a new AUDIT_ACTION_BY_ENTITY row, not a new listener.
 */
@Injectable()
export class AuditLogListener {
  private readonly logger = new Logger(AuditLogListener.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  @OnEvent(ENTITY_CREATED_EVENT)
  async handleEntityCreated(event: EntityCrudEvent): Promise<void> {
    await this.writeAuditLog(AUDIT_ACTION_BY_ENTITY[event.entityType].created, event);
  }

  @OnEvent(ENTITY_UPDATED_EVENT)
  async handleEntityUpdated(event: EntityCrudEvent): Promise<void> {
    await this.writeAuditLog(AUDIT_ACTION_BY_ENTITY[event.entityType].updated, event);
  }

  @OnEvent(ENTITY_DELETED_EVENT)
  async handleEntityDeleted(event: EntityCrudEvent): Promise<void> {
    await this.writeAuditLog(AUDIT_ACTION_BY_ENTITY[event.entityType].deleted, event);
  }

  private async writeAuditLog(action: AuditAction, event: EntityCrudEvent): Promise<void> {
    try {
      // event.payload is exactly what the caller passed to BaseService for
      // this mutation - {} for delete, the caller's data for create/update,
      // { where } for a bulk deleteMany (entityId is the BULK sentinel then,
      // not a real record id - see entity-crud.event.ts).
      await this.auditLogRepository.create({
        action,
        entityType: event.entityType,
        entityId: event.entityId,
        performedByUserId: event.actorUserId,
        payload: event.payload as Record<string, unknown>,
      });
    } catch (error) {
      // Loud, non-swallowed failure: the triggering mutation has already
      // committed and must NOT be rolled back because of this.
      this.logger.error(
        `Failed to write audit log for action=${action} entityId=${event.entityId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
