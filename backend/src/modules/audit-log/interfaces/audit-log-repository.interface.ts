import { AuditLog } from '@prisma/client';

export interface CreateAuditLogInput {
  action: string;
  entityType: string;
  entityId: string;
  performedByUserId?: string;
  payload?: Record<string, unknown>;
}

export interface IAuditLogRepository {
  create(input: CreateAuditLogInput): Promise<AuditLog>;
}
