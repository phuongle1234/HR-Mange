---
id: SOLUTION-FRONTEND-ARCHITECTURE
type: solution
module: global
status: draft
---

# Frontend Architecture

## Purpose
Define solution-level frontend architecture.

## Required Stack
- React with TypeScript.
- React Router.
- Redux Toolkit.
- TanStack Query.
- Axios.
- React Hook Form.
- Zod.
- Tailwind CSS.

## Provider Architecture
```text
ReduxProvider
└── QueryProvider
    └── AuthProvider
        └── PermissionProvider
            └── RouterProvider
```

## State Ownership
- Redux: auth and permission global client state.
- TanStack Query: server state.
- React Hook Form: form values and errors.
- Local state: UI-only state such as popups.

## API Access
- Components do not call Axios directly.
- API URLs are centralized.
- Feature services wrap API calls.
- Query/mutation hooks wrap services for React lifecycle.

## UX Requirements
- Use Green Momentum theme.
- Login and forgot password are centered auth pages.
- Create/update/delete use confirm popups where specified.
- Errors must be safe and user-readable.

## Pending Decisions
- Exact component library.
- Exact route guard composition.
- URL query sync behavior.
