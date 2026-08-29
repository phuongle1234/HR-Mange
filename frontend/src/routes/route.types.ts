export interface BreadcrumbItem {
  label: string;
  to?: string;
}

/**
 * Route metadata attached via React Router's `handle`, per
 * docs/07-frontend/react-route.md's Route Metadata table (there is no
 * `permission` key — no permission model exists).
 */
export type SidebarActiveKey =
  | 'employee.list'
  | 'employee.create'
  | 'organization.chart'
  | 'organization.types'
  | 'workflow.list'
  | 'workflow.create'
  | 'workflow.requests'
  | 'workflow.inbox'
  | null;

export interface RouteHandle {
  title: string;
  navbarBackButton?: boolean;
  navbarBackTarget?: string;
  sidebarActiveKey?: SidebarActiveKey;
  breadcrumb?: BreadcrumbItem[];
  /** Only the Employee List navbar shows the full user avatar + dropdown menu. */
  showUserMenu?: boolean;
  /** Auth-layout pages show a small tagline under the brand mark. */
  authSubtitle?: string;
}
