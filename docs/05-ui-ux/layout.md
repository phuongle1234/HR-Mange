---
id: UI-LAYOUT
type: ui
module: global
status: draft
---

# Layout

## Purpose
This file defines the shared application layout for the Employee Management System UI. The layout is a draft specification only and must be reviewed before implementation.

## Technology
- Styling: Tailwind CSS.
- Component style: utility-first classes with reusable layout components.
- Layout must be responsive and must not require page-level components to reimplement navbar/sidebar structure.

## Overall Structure
```text
┌──────────────────────────────────────────────────────────────┐
│                         NAVBAR                               │
├───────────────┬──────────────────────────────────────────────┤
│               │ WRAP CONTENT                                 │
│               │                                              │
│               │ Page Header / Page Body / Page Actions       │
│   SIDEBAR     │                                              │
│               │                                              │
│ Menu Level 1  │                                              │
│ ├ Menu Level 2│                                              │
│ └ Menu Level 2│                                              │
│               │                                              │
│ Menu Level 1  │                                              │
│ ├ Menu Level 2│                                              │
│ └ Menu Level 2│                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

## Layout Regions
| Region | Description |
| --- | --- |
| `Navbar` | Fixed top application bar. Contains back button when needed, current page title, and user menu. |
| `Sidebar` | Left navigation area. Contains module menus and child menus. |
| `Wrap Content` | Main page area. Renders breadcrumb and selected page content from `docs/05-ui-ux/pages`. |
| `Auth Content` | Account page area. Centers login, forgot password, and change password forms without navbar/sidebar when a page spec uses centered account layout. |

## Tailwind Layout Guidance
- Root container should use full viewport height: `min-h-screen`.
- Navbar should stay at top and align content horizontally.
- Sidebar should use fixed width on desktop, collapsible/hidden on mobile.
- Main content should fill remaining width and allow vertical scrolling.
- Use consistent spacing scale, for example `p-4`, `p-6`, `gap-4`, `gap-6`.
- Use the green-first `Green Momentum` theme from `UI-DESIGN-SYSTEM`.
- App layout pages use neutral work-focused surfaces with green action highlights. Avoid decorative gradients or marketing layout inside authenticated admin work areas.
- Cards may be used for form sections and information groups, but do not nest cards inside cards.

## Navbar
Navbar components:

| Component | Required | Behavior |
| --- | --- | --- |
| Back button | conditional | Show only on child pages such as create, detail, and edit. Hide on top-level list page. Clicking returns to previous page or employee list. |
| Page title | yes | Shows current page title, for example `Employees`, `Create Employee`, `Employee Detail`, `Edit Employee`. |
| Breadcrumb | optional | Render inside Wrap Content above page body, not inside Navbar. Navbar must not contain breadcrumb text. Breadcrumb segments that have a valid target must be clickable links. Can show module path such as `Employee / Create`; must not replace page title. |
| Avatar | yes | Shows current user's avatar image or fallback initials. |
| Username | yes | Shows authenticated user's display name. In the current preview, Employee List shows avatar, email, and dropdown; Create, Detail, and Edit show the compact `Admin User` text only. |
| User dropdown | conditional | In the current preview, opens from the Employee List username/avatar control and contains `Change Password` and `Logout`. Other app pages may keep the compact username-only navbar until the shared header is fully extracted. |

Navbar behavior:
- On child pages, back button is placed before title.
- Top-level pages such as Employee List hide the back button.
- Child pages such as create, detail, and edit show the back button.
- Back button target:
  - Create page: `/employees`.
  - Detail page: `/employees`.
  - Edit page: `/employees/:id` if coming from detail; fallback `/employees`.
- Dropdown closes when clicking outside or after selecting an item.
- Logout action must trigger authentication logout flow; exact API is defined in auth API spec.
- Change Password action navigates to `/change-password`.
- Do not show password, token, or sensitive user data in navbar.

## Sidebar
Sidebar menu structure for current draft:

```text
Employee
├── Employee List
└── Create Employee
```

Sidebar behavior:
- Parent menu `Employee` can expand/collapse.
- Parent menu is level 1.
- Child menu items are level 2 and must include icons so users can distinguish actions quickly.
- Clicking level 1 toggles the visibility of level 2 items.
- Active menu item is highlighted based on current route.
- `Employee List` navigates to `/employees`.
- `Create Employee` navigates to `/employees/create`.
- Detail and Edit pages are child routes but do not need permanent sidebar menu items.
- Sidebar must respect frontend permission checks:
  - Hide or disable `Create Employee` if user does not have `employee.create`.
  - Show `Employee List` only if user has `employee.read`.
- Backend authorization remains the final security boundary.

## Wrap Content
Wrap content is the area where page-specific UI is rendered.

Expected structure:
```text
Wrap Content
├── Breadcrumb
├── Page Toolbar / Filter / Action Area
├── Page Main Content
├── Loading State
├── Empty State
├── Error State
└── Modal / Confirm Dialog if required
```

Rules:
- Page content must not recreate navbar/sidebar.
- Page content must not duplicate the navbar page title as a second primary H1 unless the page spec explicitly requires it.
- Breadcrumb belongs at the top of Wrap Content and appears above the page body.
- Breadcrumb must not be rendered inside Navbar/header markup.
- Breadcrumb items with known routes must be links. The current page segment is plain text.
- Page spec files define what appears inside wrap content.
- Page actions should be close to the content they affect.
- Content width should be optimized for admin workflow scanning and form completion.
- Main content must support vertical scroll without breaking navbar/sidebar.

## Auth Layout
Auth layout is used for public authentication pages.

```text
Auth Layout
└── Auth Content
    └── Centered Auth Form
```

Rules:
- Do not render navbar or sidebar.
- Center the form horizontally and vertically in the viewport.
- Use a calm neutral background with subtle green brand accents.
- Keep the form panel constrained for readability.
- Login and Forgot Password pages use Auth Layout.

## Centered Account Layout
- Login, Forgot Password, and Change Password can use the centered account form treatment when defined by their page specs.
- Centered account pages render without navbar, sidebar, and breadcrumb.
- The form is horizontally and vertically centered in the viewport.
- The visual treatment uses the green-first brand mark, constrained form width, white elevated panel, green primary action, and a calm neutral/green background.
- Change Password keeps authenticated access requirements, but its visual page layout matches Forgot Password and does not use the app navbar back button.

## Responsive Behavior
| Viewport | Behavior |
| --- | --- |
| Desktop | Navbar top, sidebar visible, content fills remaining area. |
| Tablet | Sidebar may collapse to icons or drawer depending implementation decision. |
| Mobile | Sidebar becomes drawer; navbar keeps title and user menu; page actions may stack vertically. |

## Required Shared States
- Loading: show skeleton or spinner in wrap content.
- Empty: show concise empty state with primary action if permission allows.
- Error: show error message and retry action when applicable.
- Forbidden: show permission message when frontend detects missing permission.
- Success: use toast or inline success message depending page action.

## Pending Decisions
- Exact Tailwind class names and component library are not approved.
- Sidebar collapsed desktop behavior is not approved.
- Breadcrumb usage is approved for pages that define a breadcrumb in their page spec.
- Exact avatar image source is pending authentication/user spec.
