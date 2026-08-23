import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';

/** Optional 404 layout — not found message and navigation back to a safe page. */
export function NotFoundLayout() {
  const { authStatus } = useAuth();
  const backTarget = authStatus === 'authenticated' ? '/employees' : '/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-lg font-black text-white">
        E
      </div>
      <Outlet />
      <Link to={backTarget} className="text-sm font-bold text-brand-700 hover:underline">
        {authStatus === 'authenticated' ? 'Back to employees' : 'Back to login'}
      </Link>
    </div>
  );
}
