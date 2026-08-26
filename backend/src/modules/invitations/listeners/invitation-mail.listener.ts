import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../../common/mail/mail.service';
import { INVITATION_CREATED_EVENT, InvitationCreatedEvent } from '../events/invitation-created.event';

/**
 * Sole consumer of invitation.created. Runs after the creating transaction
 * has already committed (InvitationsService only emits post-commit), so a
 * mail failure here can never roll back the Invitation row - it only moves
 * status to SEND_FAILED (see DB-INVITATION's Status Lifecycle).
 */
@Injectable()
export class InvitationMailListener {
  private readonly logger = new Logger(InvitationMailListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
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

      await this.prisma.invitation.update({
        where: { id: event.invitationId },
        data: { status: 'SENT', sentAt: new Date(), sendAttempts: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(`Failed to send invitation email for invitation ${event.invitationId}`, error instanceof Error ? error.stack : undefined);

      await this.prisma.invitation
        .update({
          where: { id: event.invitationId },
          data: {
            status: 'SEND_FAILED',
            sendAttempts: { increment: 1 },
            lastSendError: error instanceof Error ? error.message : 'Unknown mail send error',
          },
        })
        .catch((updateError) => {
          this.logger.error(
            `Failed to record send failure for invitation ${event.invitationId}`,
            updateError instanceof Error ? updateError.stack : undefined,
          );
        });
    }
  }
}
