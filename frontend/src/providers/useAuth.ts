import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../store';
import { selectAuthStatus, selectCurrentUser } from '../store/auth/auth.selectors';
import { clearAuth } from '../store/auth/auth.slice';
import { clearStoredToken } from '../shared/auth/token-storage';
import { authApiService } from '../features/auth/services/auth.api';

/**
 * Safe, page-facing auth API. Never returns the raw token — pages only see
 * `authStatus`/`currentUser`. The Axios interceptor reads the token from the
 * Redux store directly, not through this hook.
 */
export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const authStatus = useSelector(selectAuthStatus);
  const currentUser = useSelector(selectCurrentUser);

  const logout = useCallback(async () => {
    try {
      await authApiService.logout();
    } catch {
      // Best-effort — there is no server-side session to invalidate
      // (stateless JWT). Ignore failure and clear locally regardless.
    } finally {
      clearStoredToken();
      dispatch(clearAuth());
    }
  }, [dispatch]);

  return { authStatus, currentUser, logout };
}
