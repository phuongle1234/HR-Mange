import { Controller, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { GetNotificationsQueryDto } from '../dto/get-notifications-query.dto';
import { INotificationService } from '../interfaces/notification-service.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(@Inject('INotificationService') private readonly notificationService: INotificationService) {}

  @Get()
  async findMany(@Query() query: GetNotificationsQueryDto, @CurrentUser() user: CurrentUserPayload) {
    const actor = await this.notificationService.findActorEmployee(user.id);
    const result = await this.notificationService.findManyForEmployee(actor.id, query);
    return ResponseHelper.success({ data: result.items, message: 'Notifications retrieved successfully.', meta: { limit: query.limit, total: result.total, unreadCount: result.unreadCount } });
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: CurrentUserPayload) {
    const actor = await this.notificationService.findActorEmployee(user.id);
    const data = await this.notificationService.markAllRead(actor.id);
    return ResponseHelper.success({ data, message: 'Notifications marked as read successfully.' });
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    const actor = await this.notificationService.findActorEmployee(user.id);
    const data = await this.notificationService.markRead(id, actor.id);
    return ResponseHelper.success({ data, message: 'Notification marked as read successfully.' });
  }
}
