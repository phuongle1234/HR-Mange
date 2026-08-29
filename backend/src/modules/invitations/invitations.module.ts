import { Module } from '@nestjs/common';
import { InvitationsController } from './controller/invitations.controller';
import { InvitationAcceptController } from './controller/invitation-accept.controller';
import { InvitationsService } from './service/invitations.service';
import { InvitationMailListener } from './listeners/invitation-mail.listener';

@Module({
  controllers: [InvitationsController, InvitationAcceptController],
  providers: [
    InvitationsService,
    {
      provide: 'IInvitationsService',
      useExisting: InvitationsService,
    },
    InvitationMailListener,
  ],
})
export class InvitationsModule {}
