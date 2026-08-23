---
id: UI-NAVIGATION
type: ui
module: global
status: draft
---

# Navigation

## Purpose
Define navigation behavior for public authentication pages and authenticated application pages.

## Navigation Zones
| Zone | Pages | Layout |
| --- | --- | --- |
| Public auth | Login, Forgot Password | `AuthLayout` |
| Centered account | Change Password | `CenteredAccountLayout` |
| Authenticated app | Employee pages | `AppLayout` |
| Error pages | Forbidden, Not Found | `ForbiddenLayout` or `NotFoundLayout` |

## Public Auth Navigation
- Login page route: `/login`.
- Forgot Password page route: `/forgot-password`.
- Public auth pages do not show sidebar or app navbar.
- Login form is centered in the viewport.
- Forgot Password links back to Login.
- Authenticated users visiting public-only auth pages may be redirected to `/employees` if public-only guard is approved.

## Centered Account Navigation
- Change Password route: `/change-password`.
- Change Password requires an authenticated user but uses the same centered account layout treatment as Forgot Password.
- Change Password does not show sidebar, app navbar, or breadcrumb in the current preview.
- Change Password has a `Back to employees` link that navigates to the employee area.

## Authenticated Navigation
Navbar user menu items:
- Change Password: navigates to `/change-password`.
- Logout: triggers approved logout flow.
- Logout preview link target: `login.html`.

Sidebar structure:

```text
Employee
├── Employee List
└── Create Employee
```

Rules:
- `Employee` is a level 1 collapsible menu.
- `Employee List` and `Create Employee` are level 2 child items.
- Level 2 child items must show icons.
- Clicking the level 1 menu toggles child visibility.
- Employee List requires `employee.read`.
- Create Employee requires `employee.create`.
- Change Password is available from the user menu to authenticated users and does not require an employee permission.
- Detail and Edit pages are route children but do not appear as persistent sidebar items.

## Active State
- `/employees` highlights `employee.list`.
- `/employees/create` highlights `employee.create`.
- `/employees/:id` and `/employees/:id/edit` highlight `employee.list`.
- `/change-password` does not render or highlight employee sidebar items in the current preview.

## Back Behavior
- Create page back target: `/employees`.
- Detail page back target: `/employees`.
- Edit page back target: `/employees/:id`, fallback `/employees`.
- Change Password back target: `/employees`.
- Forgot Password back target: `/login`.

## Permission Behavior
- Hide navigation items the user cannot access.
- Route guards must still enforce auth/permission boundaries.
- Backend authorization remains final boundary.

## Pending Decisions
- Whether Change Password appears only in user dropdown or also in sidebar.
- Whether public-only routes redirect authenticated users automatically.
- Exact forbidden route behavior.
