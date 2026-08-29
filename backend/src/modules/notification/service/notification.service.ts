import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseService } from '../../../common/services/base.service';
import { PaginatedResult } from '../../../common/interfaces/base.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import type { EmployeeEntity, NotificationEntity } from '../../workflow/shared/workflow-contract.types';
import { NotificationNotFoundException, WorkflowActionNotAllowedException } from '../../workflow/shared/workflow.exceptions';
import { WorkflowActionServiceDelegate } from '../../workflow/actions/interfaces/workflow-action-service.interface';
import { WorkflowPrismaClient, workflowPrisma } from '../../workflow/shared/workflow-prisma.bridge';
import { GetNotificationsQueryDto } from '../dto/get-notifications-query.dto';
import { INotificationService, NotificationListResult } from '../interfaces/notification-service.interface';

@Injectable()
export class NotificationService extends BaseService<any, GetNotificationsQueryDto> implements INotificationService {
  private readonly workflowDb: WorkflowPrismaClient;

  constructor(
    prisma: PrismaService,
    eventEmitter: EventEmitter2,
  ) {
    const db = workflowPrisma(prisma);
    super(db.notification, eventEmitter, null, (id) => new NotificationNotFoundException(id));
    this.workflowDb = db;
  }

  async findMany(query?: GetNotificationsQueryDto): Promise<PaginatedResult<NotificationEntity>> {
    const actor = await this.findActorEmployee('');
    return this.findManyForEmployee(actor.id, query ?? new GetNotificationsQueryDto());
  }

  async findManyForEmployee(employeeId: string, query: GetNotificationsQueryDto): Promise<NotificationListResult> {
    const where = { recipientEmployeeId: employeeId, ...(query.isRead === undefined ? {} : { isRead: query.isRead }) };
    const items = (await this.workflowDb.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: query.limit })) as NotificationEntity[];
    const unreadItems = (await this.workflowDb.notification.findMany({ where: { recipientEmployeeId: employeeId, isRead: false } })) as NotificationEntity[];
    return { items, total: items.length, unreadCount: unreadItems.length };
  }

  async markRead(id: string, employeeId: string): Promise<NotificationEntity> {
    const result = await this.workflowDb.notification.updateMany({ where: { id, recipientEmployeeId: employeeId }, data: { isRead: true } });
    if (result.count === 0) {
      throw new NotificationNotFoundException(id);
    }
    return (await this.workflowDb.notification.findUnique({ where: { id } })) as NotificationEntity;
  }

  async markAllRead(employeeId: string): Promise<{ updatedCount: number }> {
    const result = await this.workflowDb.notification.updateMany({ where: { recipientEmployeeId: employeeId, isRead: false }, data: { isRead: true } });
    return { updatedCount: result.count };
  }

  async findActorEmployee(actorUserId: string): Promise<EmployeeEntity> {
    const employee = (await this.workflowDb.employee.findUnique({ where: { userId: actorUserId } })) as EmployeeEntity | null;
    if (!employee) return [] as unknown as EmployeeEntity;
    return employee;
  }
}
