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
| `/change-password` | `ChangePasswordPage` | `AppLayout` | yes | `Change Password` | none |
| `/employees` | `EmployeeListPage` | `AppLayout` | yes | `Employees` | `employee.list` |
| `/employees/create` | `EmployeeCreatePage` | `AppLayout` | yes | `Create Employee` | `employee.create` |
| `/employees/:id` | `EmployeeDetailPage` | `AppLayout` | yes | `Employee Detail` | `employee.list` |
| `/employees/:id/edit` | `EmployeeEditPage` | `AppLayout` | yes | `Edit Employee` | `employee.list` |
| `*` | `NotFoundPage` | `NotFoundLayout` | no | `Page Not Found` | none |

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
layout: AppLayout
authRequired: true
title: Change Password
navbarBackButton: true
navbarBackTarget: /employees
sidebarActiveKey: none
```

## Employee Create Route
```text
path: /employees/create
component: EmployeeCreatePage
layout: AppLayout
authRequired: true
title: Create Employee
navbarBackButton: true
navbarBackTarget: /employees
sidebarActiveKey: employee.create
```
Behavior:
- `AuthGuard` checks authenticated user through `AuthProvider`.
- `AppLayout` renders Navbar, Sidebar, and WrapContent.
- `EmployeeCreatePage` renders inside WrapContent once the guard passes — no further permission check.

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
