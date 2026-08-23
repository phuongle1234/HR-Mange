import { AuditEntityType } from '../constants/audit-action.constant';

export const ENTITY_CREATED_EVENT = 'entity.created';
export const ENTITY_UPDATED_EVENT = 'entity.updated';
export const ENTITY_DELETED_EVENT = 'entity.deleted';

/**
 * `entityId` used for bulk operations (e.g. deleteMany) that affect a set of
 * rows matched by a filter rather than one specific record - there is no
 * single real id to report, so this sentinel marks the event as bulk. See
 * AuditLogListener / docs/06-api for how this is expected to read in the
 * audit log (payload carries the filter instead of a row snapshot).
 */
export const BULK_ENTITY_ID_SENTINEL = 'BULK';

/**
 * Emitted by BaseService after create/update/delete commits. One shared
 * shape for every entity - AuditLogListener subscribes to the 3 event names
 * above generically instead of per-module event classes/handlers.
 *
 * `payload` is exactly what the caller passed as business data for that
 * mutation - never the row Prisma returns, and never merged with
 * system/audit fields (createdByUserId/updatedByUserId). For `delete`,
 * `payload` is `{}` (no business data is associated with a delete). For
 * `deleteMany`, `entityId` is `BULK_ENTITY_ID_SENTINEL` and `payload` carries
 * the `where` filter instead of a per-row snapshot.
 */
export class EntityCrudEvent<TPayload = unknown> {
  constructor(
    public readonly entityType: AuditEntityType,
    public readonly entityId: string,
    public readonly payload: TPayload,
    public readonly actorUserId: string | undefined,
    public readonly occurredAt: Date,
  ) {}
}
