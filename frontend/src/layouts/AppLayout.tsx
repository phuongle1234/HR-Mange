import { useState } from 'react';
import { Link, Outlet, useMatches, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { Breadcrumb } from '../shared/components/Breadcrumb';
import { cn } from '../shared/utils/cn';
import type { RouteHandle } from '../routes/route.types';

const NAV_ITEMS: Array<{ key: 'employee.list' | 'employee.create'; label: string; to: string }> = [
  { key: 'employee.list', label: 'Employee List', to: '/employees' },
  { key: 'employee.create', label: 'Create Employee', to: '/employees/create' },
];

function Sidebar({ activeKey }: { activeKey?: string | null }) {
  return (
    <aside className="hidden w-[280px] flex-col bg-slate-950 px-4 py-6 text-white lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-base font-black text-white">
          E
        </div>
        <div>
          <p className="text-sm font-black">EmployeeOS</p>
          <p className="text-xs text-emerald-300">Admin Workspace</p>
        </div>
      </div>
      <nav className="space-y-1">
        <p className="px-3 pb-1 text-xs font-black uppercase text-slate-500">Employee</p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={cn(
              'block rounded-lg px-3 py-2 text-sm font-bold transition-colors',
              activeKey === item.key
                ? 'bg-brand-500 text-white'
                : 'text-slate-300 hover:bg-white/10',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const initials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  async function handleLogout() {
    setIsOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-2"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-black text-brand-700">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-black text-slate-950">
            {currentUser?.fullName ?? 'Account'}
          </span>
          <span className="block text-xs text-slate-500">{currentUser?.email ?? ''}</span>
        </span>
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-soft"
        >
          <Link
            to="/change-password"
            role="menuitem"
            className="block px-4 py-2 text-sm font-bold text-slate-700 hover:bg-brand-50"
            onClick={() => setIsOpen(false)}
          >
            ↻ Change Password
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left text-sm font-bold text-danger-600 hover:bg-danger-50"
          >
            ⎋ Logout
          </button>
        </div>
      )}
    </div>
  );
}

function Navbar({ handle }: { handle: RouteHandle }) {
  const navigate = useNavigate();
  const params = useParams();
  const { currentUser } = useAuth();

  function resolveBackTarget(): string {
    let target = handle.navbarBackTarget ?? '/employees';
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        target = target.replace(`:${key}`, value);
      }
    }
    return target;
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        {handle.navbarBackButton && (
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(resolveBackTarget())}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-lg font-black text-slate-700"
          >
            ‹
          </button>
        )}
        <h1 className="text-lg font-black text-slate-950">{handle.title}</h1>
      </div>
      {handle.showUserMenu ? (
        <UserMenu />
      ) : (
        <span className="text-sm font-black text-slate-950">
          {currentUser?.fullName ?? 'Account'}
        </span>
      )}
    </header>
  );
}

/** Authenticated app shell: navbar + sidebar + wrap content, per docs/05-ui-ux/layout.md. */
export function AppLayout() {
  const matches = useMatches();
  const handle = (matches.at(-1)?.handle ?? { title: '' }) as RouteHandle;

  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <Sidebar activeKey={handle.sidebarActiveKey} />
      <div className="flex min-w-0 flex-col">
        <Navbar handle={handle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {handle.breadcrumb && <Breadcrumb items={handle.breadcrumb} />}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
