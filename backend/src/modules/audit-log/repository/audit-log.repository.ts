import { Injectable } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAuditLogInput, IAuditLogRepository } from '../interfaces/audit-log-repository.interface';

/**
 * Repository layer for AuditLog: Prisma calls only (per AGENTS.md Backend Rules).
 */
@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateAuditLogInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        performedByUserId: input.performedByUserId,
        payload: (input.payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  }
}
