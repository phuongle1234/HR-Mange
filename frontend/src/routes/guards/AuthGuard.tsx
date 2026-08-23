import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { LoadingState } from '../../shared/components/PageStates';

/** Requires a valid authenticated user before rendering protected routes. */
export function AuthGuard() {
  const { authStatus } = useAuth();

  if (authStatus === 'checking') {
    return <LoadingState label="Checking your session…" />;
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
