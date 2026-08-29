import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationController } from './controller/notification.controller';
import { NotificationService } from './service/notification.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    {
      provide: 'INotificationService',
      useExisting: NotificationService,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
