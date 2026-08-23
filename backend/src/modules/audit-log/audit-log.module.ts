import { Module } from '@nestjs/common';
import { AuditLogRepository } from './repository/audit-log.repository';
import { AuditLogListener } from './listener/audit-log.listener';
// AuditLogListener subscribes to BaseService's generic entity.created/
// updated/deleted events (see common/events/entity-crud.event.ts) - no
// dependency on the Employee module is needed for that.

@Module({
  providers: [AuditLogRepository, AuditLogListener],
  exports: [AuditLogRepository],
})
export class AuditLogModule {}
