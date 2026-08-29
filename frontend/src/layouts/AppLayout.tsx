import { useState } from 'react';
import { Link, Outlet, useMatches, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import { Breadcrumb } from '../shared/components/Breadcrumb';
import { cn } from '../shared/utils/cn';
import type { RouteHandle } from '../routes/route.types';
import { NotificationBell } from '../features/notification/components/NotificationBell';
import { WorkflowSocketProvider } from '../features/workflow/components/WorkflowSocketProvider';

interface NavItem {
  key: 'employee.list' | 'employee.create' | 'organization.chart' | 'organization.types' | 'workflow.list' | 'workflow.requests' | 'workflow.inbox';
  label: string;
  to: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Employee',
    items: [
      { key: 'employee.list', label: 'Employee List', to: '/employees' },
      { key: 'employee.create', label: 'Create Employee', to: '/employees/create' },
    ],
  },
  {
    label: 'Organization',
    items: [
      { key: 'organization.chart', label: 'Organization Chart', to: '/organizations' },
      { key: 'organization.types', label: 'Organization Types', to: '/organizations/types' },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { key: 'workflow.list', label: 'Workflow Definitions', to: '/workflows' },
      { key: 'workflow.requests', label: 'My Requests', to: '/workflow-requests' },
      { key: 'workflow.inbox', label: 'Reviewer Inbox', to: '/workflow-requests/inbox' },
    ],
  },
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
      <nav className="space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-xs font-black uppercase text-slate-500">{group.label}</p>
            {group.items.map((item) => (
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
          </div>
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
                  ? currentUser.fullName.split(' ').map((part) => part.charAt(0)).slice(0, 2).join('').toUpperCase()
                  : '?';

  async function handleLogout() {
    setIsOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative">
      <button className="flex items-center gap-2" aria-haspopup="menu" aria-expanded={isOpen} type="button" onClick={() => setIsOpen((value) => !value)} >
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
        <div role="menu" className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-soft">
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
      <div className="flex items-center gap-3">
        <NotificationBell />
        <UserMenu />
      </div>
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
        <main className="flex-1 p-2 sm:p-6 lg:p-4">
          {handle.breadcrumb && <Breadcrumb items={handle.breadcrumb} />}
          <WorkflowSocketProvider />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
