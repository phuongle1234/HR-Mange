---
id: FRONTEND-REACT-ROUTE
type: frontend
module: global
status: draft
depends_on:
  - UI-LAYOUT
  - FRONTEND-AUTHENTICATION
  - FRONTEND-AUTHORIZATION
---

# React Route

## Purpose
Define the frontend route structure, layout mapping, route guards, and provider usage. This file is the source of truth for route-level design.

## Route File
All application routes must be defined in one central route file:
```text
src/routes/app.routes.tsx
```
Do not create module route files such as `employee.routes.tsx` or `auth.routes.tsx` unless this specification is changed and approved later.

## Provider Tree
No `PermissionProvider` exists (per `WORK-000` decision #2).
```text
ReduxProvider
└── QueryProvider
    └── AuthProvider
        └── RouterProvider
            └── Route Layout
                └── Page Component
```

## Route Layouts
| Layout | Purpose | Contains |
| --- | --- | --- |
| `AuthLayout` | Public authentication pages | Centered auth content, no sidebar |
| `AppLayout` | Authenticated application pages | Navbar, Sidebar, WrapContent |
| `NotFoundLayout` | Optional 404 page | Not found message and navigation back to safe page |

There is no `ForbiddenLayout` — with no permission model, there is no permission-denial state to render (only `UNAUTHORIZED` → redirect to `/login`).

## Route Guards
| Guard | Responsibility |
| --- | --- |
| `AuthGuard` | Requires a valid authenticated user before rendering protected route. |
| `PublicOnlyGuard` | Redirects authenticated users away from `/login` to `/employees`. |

There is no `PermissionGuard`.

## Route Metadata
| Key | Description |
| --- | --- |
| `path` | React Router path |
| `component` | Page component rendered by route |
| `layout` | Layout component name |
| `authRequired` | Whether route requires authenticated user |
| `title` | Navbar/page title |
| `navbarBackButton` | Whether navbar back button is visible |
| `navbarBackTarget` | Default back target |
| `sidebarActiveKey` | Sidebar active menu key |

There is no `permission` metadata key.

## Current Routes
| Route | Component | Layout | Auth | Title | Sidebar Active |
| --- | --- | --- | --- | --- | --- |
| `/login` | `LoginPage` | `AuthLayout` | no | `Login` | none |
| `/forgot-password` | `ForgotPasswordPage` | `AuthLayout` | no | `Forgot Password` | none |
| `/change-password` | `ChangePasswordPage` | `AuthLayout` | **no** | `Change Password` | none |
| `/invitation/accept` | `InvitationAcceptPage` | `AuthLayout` | **no** | (no navbar) | none |
| `/employees` | `EmployeeListPage` | `AppLayout` | yes | `Employees` | `employee.list` |
| `/employees/create` | `EmployeeCreatePage` | `AppLayout` | yes | `Create Employees` | `employee.create` |
| `/employees/:id` | `EmployeeDetailPage` | `AppLayout` | yes | `Employee Detail` | `employee.list` |
| `/employees/update` | `EmployeeUpdatePage` | `AppLayout` | yes | `Update Employees` | `employee.list` |
| `/organizations` | `OrganizationPage` | `AppLayout` | yes | `Organization` | `organization.chart` |
| `/organizations/types` | `OrganizationTypeListPage` | `AppLayout` | yes | `Organization Types` | `organization.types` |
| `/organizations/types/create` | `OrganizationTypeCreatePage` | `AppLayout` | yes | `Create Organization Types` | `organization.types` |
| `/organizations/types/update` | `OrganizationTypeUpdatePage` | `AppLayout` | yes | `Update Organization Types` | `organization.types` |
| `*` | `NotFoundPage` | `NotFoundLayout` | no | `Page Not Found` | none |

`/change-password` moved from `AppLayout`/`AuthGuard` to `AuthLayout` (ungated) — see "Change Password Route" below for what this means in practice.

**2026-08-26 changes:**
- `/invitation/accept` is new — see `FRONTEND-INVITATION-ACCEPT`. Ungated the same way `/forgot-password`/`/change-password` are, not `PublicOnlyGuard`-gated (see that spec's Route Reference for why).
- `/employees/create`'s content changes to a bulk table editor (`FRONTEND-EMPLOYEE-CREATE`); the path itself is unchanged.
- `/employees/update` is new, replacing the **removed** `/employees/:id/edit` (`EmployeeEditPage`, single-record). See `FRONTEND-EMPLOYEE-EDIT` for the bulk replacement and its rationale.

## Login Route
```text
path: /login
component: LoginPage
layout: AuthLayout
authRequired: false
title: Login
navbarBackButton: false
navbarBackTarget: none
sidebarActiveKey: none
```
Behavior:
- Render centered login form.
- Authenticated users visiting `/login` are redirected to `/employees` (`PublicOnlyGuard`).
- Login success navigates to `/employees`.

## Forgot Password Route
```text
path: /forgot-password
component: ForgotPasswordPage
layout: AuthLayout
authRequired: false
title: Forgot Password
navbarBackButton: false
navbarBackTarget: /login
sidebarActiveKey: none
```

## Change Password Route
```text
path: /change-password
component: ChangePasswordPage
layout: AuthLayout
authRequired: false
title: Change Password
sidebarActiveKey: none
```
**Not gated by `AuthGuard`** — reachable by an unauthenticated visitor, and rendered inside `AuthLayout` (the centered public-auth shell, no Navbar/Sidebar), the same as `/login`/`/forgot-password`. `navbarBackButton`/`navbarBackTarget` set on this route's `handle` have no effect, since `AuthLayout` never renders a Navbar to read them. This is a deliberate change made directly in code, not the original design (the route previously required auth and rendered inside `AppLayout`) — `ChangePasswordPage`'s own form/mutation behavior is unaffected, only how the route is reached and what shell it renders in.

## Employee Create Route
```text
path: /employees/create
component: EmployeeCreatePage
layout: AppLayout
authRequired: true
title: Create Employees
navbarBackButton: true
navbarBackTarget: /employees
sidebarActiveKey: employee.create
```
Behavior:
- `AuthGuard` checks authenticated user through `AuthProvider`.
- `AppLayout` renders Navbar, Sidebar, and WrapContent.
- `EmployeeCreatePage` renders inside WrapContent once the guard passes — no further permission check.
- **2026-08-26:** page content is now the bulk table editor (`FRONTEND-EMPLOYEE-CREATE`); route/guard/layout are unchanged.

## Employee Update Route (2026-08-26, new)
```text
path: /employees/update
component: EmployeeUpdatePage
layout: AppLayout
authRequired: true
title: Update Employees
navbarBackButton: true
navbarBackTarget: /employees
sidebarActiveKey: employee.list
```
Behavior:
- Same guard/layout pattern as the Organization Type Update route below.
- Reads checked ids from Redux key `employee_checked`; if none exist, renders a safe empty-selection state instead of calling the API (`FRONTEND-EMPLOYEE-EDIT`).
- Replaces the removed `/employees/:id/edit` route.

## Invitation Accept Route (2026-08-26, new)
```text
path: /invitation/accept
component: InvitationAcceptPage
layout: AuthLayout
authRequired: false
title: (none — AuthLayout has no Navbar)
sidebarActiveKey: none
```
Behavior:
- Not gated by `AuthGuard` (no account exists yet for the visitor) and not gated by `PublicOnlyGuard` (an authenticated user must still be able to complete an invitation link).
- Reads `token` from the URL query string; see `FRONTEND-INVITATION-ACCEPT`.

## Organization Type Routes
```text
path: /organizations/types
component: OrganizationTypeListPage
layout: AppLayout
authRequired: true
title: Organization Types
sidebarActiveKey: organization.types

path: /organizations/types/create
component: OrganizationTypeCreatePage
layout: AppLayout
authRequired: true
title: Create Organization Types
navbarBackButton: true
navbarBackTarget: /organizations/types
sidebarActiveKey: organization.types

path: /organizations/types/update
component: OrganizationTypeUpdatePage
layout: AppLayout
authRequired: true
title: Update Organization Types
navbarBackButton: true
navbarBackTarget: /organizations/types
sidebarActiveKey: organization.types
```
Behavior:
- All three routes require `AuthGuard`.
- No permission check exists in this phase.
- The sidebar renders these routes under the `Organization` group.
- The update route reads checked ids from Redux key `organization_type_checked`; if no ids exist, it renders a safe empty-selection state instead of calling the API.

## Not Found Route
```text
path: *
component: NotFoundPage
layout: NotFoundLayout
authRequired: false
title: Page Not Found
navbarBackButton: optional
navbarBackTarget: /employees if authenticated, /login if unauthenticated
sidebarActiveKey: none
```

## Pending Decisions
- Whether guards are route wrappers or layout-level checks is an implementation detail, not user-blocking.
