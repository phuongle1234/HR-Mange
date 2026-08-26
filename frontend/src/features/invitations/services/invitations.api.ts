import { ApiEndpoints } from '../../../shared/api/api-endpoints';
import { baseApiService } from '../../../shared/api/base-api.service';
import type { AcceptInvitationPayload, CreateInvitationPayload, InvitationResponse } from '../types/invitation.types';

export const invitationsApiService = {
  create(payload: CreateInvitationPayload): Promise<InvitationResponse[]> {
    return baseApiService.post<InvitationResponse[]>(ApiEndpoints.invitations.create(), payload);
  },
  accept(payload: AcceptInvitationPayload): Promise<{ ok: true; message: string }> {
    return baseApiService.post<{ ok: true; message: string }>(ApiEndpoints.invitations.accept(), payload);
  },
};
