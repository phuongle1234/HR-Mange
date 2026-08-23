---
id: TEMPLATE-ID
type: frontend
module: module-name
status: draft
depends_on:
  - RELATED-SPEC-ID
---

# Template

## Purpose
Describe the frontend responsibility of this spec. State whether the spec defines architecture, a provider, a route, a page, a hook, an API service, state ownership, or a reusable UI behavior.

This section must answer:
- What user or developer problem this spec solves.
- Which part of the React application owns the behavior.
- Which related UI, API, business, or solution specs are required before implementation.

## Scope
In scope:
- Frontend behavior owned by this spec.
- State ownership and data flow.
- Required hooks, services, providers, or components.
- Loading, empty, error, forbidden, and success behavior when applicable.
- Validation and security expectations that the frontend can enforce.

Out of scope:
- Backend business rules not defined in API/business specs.
- Database fields not defined in database specs.
- Unapproved API endpoints, permissions, or DTO fields.
- Styling details that belong only in UI/UX specs unless needed for behavior.

## Dependencies
List exact spec dependencies.

```text
docs/00-project/*
docs/01-business/*
docs/02-solution/*
docs/03-technology/*
docs/05-ui-ux/*
docs/06-api/*
docs/07-frontend/*
```

Dependency rules:
- Page specs must depend on their UI page spec and required API specs.
- Provider specs must depend on architecture, API client, and state management specs as needed.
- API service specs must depend on API endpoint specs.
- Do not implement or describe fields, permissions, or endpoints that are not defined by dependency specs.

## Proposed Files
Use proposed file paths only when the implementation location is known.

```text
src/path/to/file.ts
src/path/to/component.tsx
```

Rules:
- Proposed files are draft until implementation begins.
- Keep shared behavior in shared modules.
- Keep feature-specific behavior inside the feature module.
- Do not create module route files unless `FRONTEND-REACT-ROUTE` is changed and approved.

## Responsibilities
This spec owns:
- Responsibility one.
- Responsibility two.
- Responsibility three.

This spec must not own:
- Responsibility owned by another spec.
- Backend authorization enforcement.
- Business decisions that are pending approval.

## Data Flow
```text
User or route event
    ↓
Component / provider / hook receives input
    ↓
Local state, Redux, or TanStack Query is read
    ↓
API service is called when enabled
    ↓
Response is normalized or mapped
    ↓
UI renders loading / error / success state
```

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| Example UI state | Local React state | Use for component-only behavior. |
| Example server state | TanStack Query | Use for API response data and cache. |
| Example global client state | Redux Toolkit | Use only for app-wide client state. |

State ownership rules:
- Redux is for global client state.
- TanStack Query is for server state.
- Local React state is for local UI state.
- React Hook Form owns form values and validation state.
- Do not duplicate the same state across owners unless a spec explains why.

## Hooks
| Hook | Purpose |
| --- | --- |
| `useExample()` | Describe why this hook is used. |

## Services
| Service | Purpose |
| --- | --- |
| `ExampleApiService` | Describe API ownership. |

Service rules:
- Components must not hard-code API URLs.
- API URLs belong in centralized endpoint config.
- Axios interceptors own common auth/error behavior.
- Services return typed data or typed errors according to API client spec.

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `handleExample()` | Describe event behavior. |

## Loading State
- Describe when loading appears.
- Describe which controls are disabled while loading.
- Prevent duplicate actions when a mutation is pending.

## Empty State
- Describe when empty state appears.
- Describe allowed actions from empty state.
- Hide actions if permission is missing.

## Error State
- Field-level errors appear near fields when applicable.
- Form-level or page-level errors appear in the relevant content area.
- Do not expose stack trace or raw backend error object.
- Do not log passwords, JWTs, refresh tokens, secrets, API keys, credentials, or unnecessary sensitive data.

## Forbidden State
- Frontend permission checks may hide or disable UI actions.
- Protected routes must use route guards where required.
- Backend authorization remains the final security boundary.

## Success State
- Describe success feedback, such as toast or inline state.
- Describe cache invalidation when server state changes.
- Describe navigation after success if approved.

## Validation
- Client validation must mirror API spec where possible.
- DTO/API/custom validation remains source for business validation.
- Do not validate blocked or unapproved domain rules as if they are final.

## Render Flow
```text
Route guard passes
    ↓
Component mounts
    ↓
Required state and query hooks initialize
    ↓
UI renders loading / empty / error / success
    ↓
User performs action
    ↓
Mutation or local state update runs
    ↓
UI updates according to result
```

## Cleanup
- Local state clears by unmount unless a spec requires persistence.
- Do not clear Redux or TanStack Query cache unless the behavior requires it.
- Cancel subscriptions or timers when they are introduced.

## Test Notes
Implementation tasks based on this spec must add:
- Unit tests for helpers, hooks, reducers, and services where applicable.
- Component tests for page behavior and permission states where applicable.
- HTTP/API mock tests for API service behavior where applicable.
- Command documentation for test execution.
- Markdown test report.

Do not claim tests passed unless they were executed.

## Ambiguities
- List every missing API, field, permission, route, or UX behavior needed for implementation.
- Keep ambiguous decisions visible until approved.
