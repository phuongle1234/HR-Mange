import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApiService } from '../services/invitations.api';
import type { CreateInvitationPayload } from '../types/invitation.types';

export function useCreateInvitationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvitationPayload) => invitationsApiService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useAcceptInvitationMutation() {
  return useMutation({
    mutationFn: (payload: { token: string }) => invitationsApiService.accept(payload),
  });
}
