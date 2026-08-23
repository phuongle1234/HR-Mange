import { Outlet, useMatches } from 'react-router-dom';
import type { RouteHandle } from '../routes/route.types';

/** Centered public auth layout — no navbar/sidebar, per docs/05-ui-ux/layout.md. */
export function AuthLayout() {
  const matches = useMatches();
  const handle = (matches.at(-1)?.handle ?? {}) as RouteHandle;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#d1fadf_0,_transparent_34%),linear-gradient(180deg,_#f8faf9,_#eef2f0)] px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-lg font-black text-white shadow-lg shadow-emerald-100">
            E
          </div>
          <div>
            <p className="text-xl font-black text-slate-950">EmployeeOS</p>
            <p className="text-xs font-semibold uppercase text-brand-700">
              {handle.authSubtitle ?? 'Green Momentum'}
            </p>
          </div>
        </div>
        <div className="w-full rounded-2xl border border-white/70 bg-white/95 p-8 shadow-soft backdrop-blur">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
