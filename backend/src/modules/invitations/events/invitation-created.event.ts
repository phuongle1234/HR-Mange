export const INVITATION_CREATED_EVENT = 'invitation.created';

/**
 * Dedicated event (not the shared EntityCrudEvent) because this carries the
 * one-time invitation URL, which must never be logged or persisted anywhere
 * (see API-INVITATIONS-CREATE). Published only after the creating
 * transaction commits, one event per invitation - InvitationMailListener is
 * the sole consumer.
 */
export class InvitationCreatedEvent {
  constructor(
    public readonly invitationId: string,
    public readonly employeeId: string,
    public readonly email: string,
    public readonly employeeName: string,
    public readonly invitationUrl: string,
    public readonly expiresAt: Date,
  ) {}
}
