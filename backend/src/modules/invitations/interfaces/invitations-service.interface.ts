import { Invitation, Prisma } from '@prisma/client';
import { IBaseService } from '../../../common/interfaces/base.interface';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { GetInvitationsQueryDto } from '../dto/get-invitations-query.dto';

export interface InvitationCreatedResult {
  employeeId: string;
  invitationId: string;
}

export interface InvitationSkippedResult {
  employeeId: string;
  reason: 'EMPLOYEE_NOT_FOUND' | 'USER_ALREADY_EXISTS' | 'EMPLOYEE_MISSING_EMAIL';
}

export interface CreateInvitationsResult {
  created: InvitationCreatedResult[];
  skipped: InvitationSkippedResult[];
}

/**
 * Extends the shared base contract (AGENTS.md: Controller depends on the
 * interface, which builds on `IBaseService`). The three methods below are
 * the genuinely Invitation-specific operations that no base CRUD method
 * covers; every row write inside them still goes through inherited
 * BaseService methods.
 *
 * `createInvitations` is deliberately NOT named `createMany` - `createMany`
 * is inherited from `IBaseService` with the base signature
 * (`(items, actorUserId) => Promise<Invitation[]>`) and must keep it. This
 * method takes employee ids and returns a created/skipped partition, so it
 * is a different operation with its own name rather than a redefinition of
 * the base one.
 */
export interface IInvitationsService
  extends IBaseService<
    Invitation,
    Prisma.InvitationUncheckedCreateInput,
    Prisma.InvitationUncheckedUpdateInput,
    GetInvitationsQueryDto
  > {
  createInvitations(employeeIds: string[], actorUserId: string): Promise<CreateInvitationsResult>;
  markSent(invitationId: string): Promise<void>;
  markSendFailed(invitationId: string, errorMessage: string): Promise<void>;

  /**
   * Redeems an invitation: creates the `User`, links it to the `Employee`, and
   * marks the invitation `ACCEPTED` - all in one transaction.
   *
   * Unauthenticated: the raw token is the caller's only credential, so this
   * takes no `actorUserId`. It is also the only path that sets
   * `employees.user_id`.
   */
  acceptInvitation(dto: AcceptInvitationDto): Promise<void>;
}
