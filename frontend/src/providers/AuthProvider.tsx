import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { setAuthChecking, setAuthenticated, setUnauthenticated } from '../store/auth/auth.slice';
import { clearStoredToken, readStoredToken } from '../shared/auth/token-storage';
import { authApiService } from '../features/auth/services/auth.api';

/**
 * Initializes auth state on app start, per docs/07-frontend/providers/auth-provider.md:
 * - No stored token -> unauthenticated immediately, no API call.
 * - Stored token -> verify with GET /api/auth/me; success -> authenticated,
 *   failure (401/network) -> clear token, unauthenticated.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = readStoredToken();

    if (!token) {
      dispatch(setUnauthenticated());
      return;
    }

    dispatch(setAuthChecking(token));

    authApiService
      .getMe()
      .then((user) => {
        dispatch(setAuthenticated({ accessToken: token, currentUser: user }));
      })
      .catch(() => {
        clearStoredToken();
        dispatch(setUnauthenticated());
      });
  }, [dispatch]);

  return <>{children}</>;
}
