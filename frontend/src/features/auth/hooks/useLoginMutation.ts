import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../store';
import { setAuthenticated } from '../../../store/auth/auth.slice';
import { writeStoredToken } from '../../../shared/auth/token-storage';
import { authApiService, type LoginPayload } from '../services/auth.api';

/**
 * Submits POST /api/auth/login. On success, persists the token
 * (Redux + localStorage) and marks the session authenticated — per
 * docs/07-frontend/providers/auth-provider.md ("no extra GET /api/auth/me
 * call is needed right after login since the login response already
 * includes the user").
 */
export function useLoginMutation() {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApiService.login(payload),
    onSuccess: (result) => {
      writeStoredToken(result.accessToken);
      dispatch(setAuthenticated({ accessToken: result.accessToken, currentUser: result.user }));
    },
  });
}
