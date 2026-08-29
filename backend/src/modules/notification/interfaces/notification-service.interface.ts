import { IBaseService, PaginatedResult } from '../../../common/interfaces/base.interface';
import type { EmployeeEntity, NotificationEntity } from '../../workflow/shared/workflow-contract.types';
import type { GetNotificationsQueryDto } from '../dto/get-notifications-query.dto';

export interface NotificationListResult extends PaginatedResult<NotificationEntity> {
  unreadCount: number;
}

export interface INotificationService extends IBaseService<any, any, any, GetNotificationsQueryDto> {
  findManyForEmployee(employeeId: string, query: GetNotificationsQueryDto): Promise<NotificationListResult>;
  findActorEmployee(actorUserId: string): Promise<EmployeeEntity>;
  markRead(id: string, employeeId: string): Promise<NotificationEntity>;
  markAllRead(employeeId: string): Promise<{ updatedCount: number }>;
}
