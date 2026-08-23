import { useMutation } from '@tanstack/react-query';
import { authApiService, type ChangePasswordPayload } from '../services/auth.api';

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApiService.changePassword(payload),
  });
}
