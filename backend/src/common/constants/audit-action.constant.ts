/**
 * Audit log "action" values used by this phase.
 * The `AuditLog.action` column is a plain string (not a Prisma enum) per
 * docs/04-database/entities/audit-log.md, since the full action list is not
 * yet finalized. Auth events (login/password-change) are explicitly out of
 * scope for this phase per WORK-000 decision #9 - do not add them here.
 */
export enum AuditAction {
  EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED = 'EMPLOYEE_DELETED',
}

export enum AuditEntityType {
  EMPLOYEE = 'EMPLOYEE',
}
