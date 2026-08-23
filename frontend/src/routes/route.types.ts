export interface BreadcrumbItem {
  label: string;
  to?: string;
}

/**
 * Route metadata attached via React Router's `handle`, per
 * docs/07-frontend/react-route.md's Route Metadata table (there is no
 * `permission` key — no permission model exists).
 */
export interface RouteHandle {
  title: string;
  navbarBackButton?: boolean;
  navbarBackTarget?: string;
  sidebarActiveKey?: 'employee.list' | 'employee.create' | 'organization.chart' | null;
  breadcrumb?: BreadcrumbItem[];
  /** Only the Employee List navbar shows the full user avatar + dropdown menu. */
  showUserMenu?: boolean;
  /** Auth-layout pages show a small tagline under the brand mark. */
  authSubtitle?: string;
}
