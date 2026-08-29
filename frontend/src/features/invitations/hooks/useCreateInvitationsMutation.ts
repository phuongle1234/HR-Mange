import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApiService } from '../services/invitations.api';
import type { AcceptInvitationPayload, CreateInvitationPayload } from '../types/invitation.types';

export function useCreateInvitationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvitationPayload) => invitationsApiService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

/**
 * Redeems an invitation. Unauthenticated - the raw token from the emailed URL
 * is the only credential, and the account does not exist yet.
 *
 * No cache invalidation: nothing in this session's cache describes the account
 * being created, and the flow ends by navigating to /login.
 */
export function useAcceptInvitationMutation() {
  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) => invitationsApiService.accept(payload),
  });
}
