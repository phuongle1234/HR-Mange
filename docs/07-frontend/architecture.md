---
id: FRONTEND-ARCHITECTURE
type: frontend
module: global
status: draft
depends_on:
  - TECH-FRONTEND
  - UI-LAYOUT
  - FRONTEND-REACT-ROUTE
  - FRONTEND-API-CLIENT
  - FRONTEND-STATE-MANAGEMENT
---

# Architecture

## Purpose
Define the React frontend architecture for the Employee Management System. This spec describes application layering, provider order, feature structure, state ownership, routing boundaries, API service boundaries, and cross-cutting behavior.

## Technology
- React with TypeScript.
- React Router for routing.
- Redux Toolkit for global client state.
- TanStack Query for server state.
- Axios for HTTP requests.
- React Hook Form and Zod for forms.
- `react-toastify` for toast feedback.
- Tailwind CSS for styling according to UI/UX specs.

## Application Layers
```text
src
├── app
│   ├── App.tsx
│   └── providers
├── routes
│   └── app.routes.tsx
├── layouts
│   ├── AppLayout.tsx
│   ├── AuthLayout.tsx
│   └── NotFoundLayout.tsx
├── providers
│   └── AuthProvider.tsx
├── store
├── shared
│   ├── api
│   ├── components
│   │   ├── Button.tsx
│   │   ├── PageStates.tsx
│   │   ├── SearchAndFilterBar.tsx
│   │   ├── Pagination.tsx (shared pagination wrapper around MUI `Pagination`)
│   │   ├── ResponsiveGrid.tsx
│   │   └── Breadcrumb.tsx
│   ├── hooks
│   ├── utils
│   └── validation
└── features
    ├── auth
    ├── employee
    ├── organization
    └── organization-type
```

Rules:
- Shared modules contain reusable behavior only.
- Feature modules contain domain-specific pages, hooks, services, schemas, and helpers.
- Page components orchestrate hooks and render UI; they do not own API client setup.
- Layout components own navbar/sidebar/wrap content structure; pages do not recreate layout.
- Reusable list-page primitives such as `SearchAndFilterBar`, `Pagination`, and `ResponsiveGrid` belong in `shared/components` and are intended to be composed by multiple list pages.

## Provider Tree
The provider order is defined by route spec and must be preserved.

```text
ReduxProvider
└── QueryProvider
    └── AuthProvider
        └── RouterProvider
            └── Route Layout
                └── Page Component
```

Responsibilities:
- ReduxProvider exposes global client state.
- QueryProvider exposes server-state cache.
- AuthProvider initializes authentication state (Bearer token, per `WORK-000` decision #4).
- RouterProvider renders route guards, layouts, and pages.

There is no `PermissionProvider` — no permission/role model exists (`WORK-000` decision #2).

## Routing Boundary
All application routes must be defined centrally in:

```text
src/routes/app.routes.tsx
```

Rules:
- Do not create feature route files unless `FRONTEND-REACT-ROUTE` is changed and approved.
- Route metadata defines layout, auth, permission, title, back target, and sidebar active key.
- `AuthGuard` handles authenticated access.
- `PermissionGuard` handles permission-gated access.
- Route guards prevent protected page rendering before required auth/permission state is ready.

## Feature Module Pattern
Employee feature proposed structure:

```text
src/features/employee
├── pages
├── components
│   ├── StatusBadge.tsx
│   ├── DeleteEmployeeDialog.tsx
│   └── EmployeeTable.tsx (optional, if a list table is extracted later)
├── hooks
├── services
├── schemas
├── types
└── utils
```

Rules:
- Page files render page-level behavior described in `docs/07-frontend/pages`.
- Components are presentational or feature-local reusable UI pieces.
- Hooks wrap TanStack Query mutations/queries and feature-specific composition.
- Services call API client and endpoints.
- Schemas hold Zod validation.
- Utils hold pure helpers such as payload builders and display mapping.
- List pages should use shared list primitives (`SearchAndFilterBar`, `Pagination`, `ResponsiveGrid`) rather than duplicating toolbar and pagination markup in each page.

Auth feature proposed structure:

```text
src/features/auth
├── pages
│   ├── LoginPage.tsx
│   ├── ForgotPasswordPage.tsx
│   └── ChangePasswordPage.tsx
├── hooks
├── services
├── schemas
└── types
```

Rules:
- Login and Forgot Password render in `AuthLayout`.
- Change Password renders in `AppLayout`.
- Password values must stay inside form submit lifecycle and must not be stored globally.

OrganizationType feature proposed structure:

```text
src/features/organization-type
├── pages
│   ├── OrganizationTypeListPage.tsx
│   ├── OrganizationTypeCreatePage.tsx
│   └── OrganizationTypeUpdatePage.tsx
├── hooks
├── services
├── schemas
├── types
└── utils
```

Rules:
- The frontend source of truth for API shape is `docs/06-api/organization-type/*.md`, not backend source.
- Use mock/stub API data only as a temporary development adapter; page logic and service types must match the documented contract.
- Shared right-click menu behavior belongs in `shared/components/ContextMenu.tsx`.
- Shared arrow-key table input focus behavior belongs in `shared/hooks/useGridInputNavigation.ts`.

## State Ownership
| State | Owner |
| --- | --- |
| Auth status, access token, and current user | Redux through AuthProvider |
| Employee list/detail data | TanStack Query |
| Organization type list/by-ids data | TanStack Query |
| Organization type checked ids for update handoff | Redux Toolkit |
| Create/edit form values | React Hook Form |
| Auth form values | React Hook Form |
| Search/filter/page UI state | Local React state or approved URL search params |
| Modal/popup open state | Local React state |
| Toasts | `react-toastify` |

Rules:
- Do not store server response lists/details in Redux.
- Do not store form values in Redux.
- Do not store local popup state in Redux.
- Do not duplicate Query cache data into local state except for controlled form reset snapshots.

## API Boundary
```text
Page
    ↓
Feature hook / TanStack Query hook
    ↓
Feature API service
    ↓
Base API service / Axios client
    ↓
Backend API
```

Rules:
- Components do not call Axios directly.
- Components do not hard-code URLs.
- Feature services do not own UI state.
- API errors are normalized before UI mapping.

## Forms And Validation
Required pattern:
```text
React Hook Form
    ↓
Zod resolver
    ↓
Payload builder
    ↓
Confirm popup when required
    ↓
Mutation hook
```

Rules:
- Client validation mirrors API DTO rules where possible.
- Business validation such as uniqueness remains API/DTO/custom validation responsibility.
- Create, edit, and delete flows must use confirm popup where page specs require it.

## UI Behavior
- Use `AppLayout` for authenticated employee pages.
- Use wrap content for page body.
- Use loading, empty, error, forbidden, and success states consistently.
- Use destructive styling for delete confirmation.
- Keep admin UI work-focused and dense enough for scanning.

## Error Handling
- Field-level errors render near fields.
- Form-level errors render near form actions or inside confirm popup when mutation fails after confirmation.
- Page-level errors render in wrap content with retry where applicable.
- Do not render raw backend error object.
- Do not log secrets or credentials.

## Testing Requirements
Implementation work must include:
- Unit tests for reducers, helpers, schemas, and payload builders.
- Hook tests for query/mutation behavior where practical.
- Component tests for guards, forms, popups, loading/error states, and permissions.
- API service tests using mocked Axios responses.
- Markdown test report and command documentation.

## Pending Decisions
- Exact component library, if any.
- Exact route guard implementation style.
- Exact styling tokens and Tailwind classes.
