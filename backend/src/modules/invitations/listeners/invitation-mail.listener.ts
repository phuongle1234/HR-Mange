import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../../../common/mail/mail.service';
import { INVITATION_CREATED_EVENT, InvitationCreatedEvent } from '../events/invitation-created.event';
import { IInvitationsService } from '../interfaces/invitations-service.interface';

/**
 * Sole consumer of invitation.created. Runs after the creating write has
 * already committed (InvitationsService only emits post-write), so a mail
 * failure here can never roll back the Invitation row - it only moves
 * status to SEND_FAILED (see DB-INVITATION's Status Lifecycle).
 *
 * Status writes go through `IInvitationsService` (which reaches Prisma
 * through inherited BaseService methods), never through PrismaService
 * directly, per AGENTS.md's mandatory backend flow.
 */
@Injectable()
export class InvitationMailListener {
  private readonly logger = new Logger(InvitationMailListener.name);

  constructor(
    private readonly mailService: MailService,
    @Inject('IInvitationsService') private readonly invitationsService: IInvitationsService,
  ) {}

  @OnEvent(INVITATION_CREATED_EVENT, { async: true })
  async handleInvitationCreated(event: InvitationCreatedEvent): Promise<void> {
    try {
      await this.mailService.sendInvitation({
        to: event.email,
        name: event.employeeName,
        invitationUrl: event.invitationUrl,
        expiresAt: event.expiresAt,
      });

      await this.invitationsService.markSent(event.invitationId);
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email for invitation ${event.invitationId}`,
        error instanceof Error ? error.stack : undefined,
      );

      const message = error instanceof Error ? error.message : 'Unknown mail send error';
      await this.invitationsService.markSendFailed(event.invitationId, message).catch((updateError) => {
        this.logger.error(
          `Failed to record send failure for invitation ${event.invitationId}`,
          updateError instanceof Error ? updateError.stack : undefined,
        );
      });
    }
  }
}
