import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { LoadingState } from '../../shared/components/PageStates';

/** Redirects authenticated users away from public-only routes (e.g. /login) to /employees. */
export function PublicOnlyGuard() {
  const { authStatus } = useAuth();

  if (authStatus === 'checking') {
    return <LoadingState label="Checking your session…" />;
  }

  if (authStatus === 'authenticated') {
    return <Navigate to="/employees" replace />;
  }

  return <Outlet />;
}
