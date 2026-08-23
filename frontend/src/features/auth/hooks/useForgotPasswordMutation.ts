import { useMutation } from '@tanstack/react-query';
import { authApiService, type ForgotPasswordPayload } from '../services/auth.api';

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApiService.forgotPassword(payload),
  });
}
