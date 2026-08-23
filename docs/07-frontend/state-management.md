---
id: FRONTEND-STATE-MANAGEMENT
type: frontend
module: global
status: draft
depends_on:
  - TECH-FRONTEND
  - FRONTEND-AUTHENTICATION
  - FRONTEND-AUTHORIZATION
---

# State Management

## Purpose
Define state ownership rules for the React frontend. This spec prevents duplicated state, unclear cache ownership, and accidental storage of sensitive data.

## State Owners
| State Type | Owner | Examples |
| --- | --- | --- |
| Global client state | Redux Toolkit | Auth status, current user, permission state. |
| Server state | TanStack Query | Employee list, employee detail, API-loaded options. |
| Form state | React Hook Form | Create/edit employee values and field errors. |
| Local UI state | React component state | Modal open state, selected row, filters when URL sync is not approved. |
| URL state | React Router search params | Page/search/filter state only if approved. |
| Toast state | `react-toastify` | Success/error toast notifications. |

## Redux Toolkit
Redux is allowed for app-wide client state only.

Proposed slices:

```text
store
├── auth
└── permission
```

Redux should store:
- `authStatus`
- `currentUser`
- `isAuthInitialized`
- `authError`
- `permissionStatus`
- `permissions`
- `permissionError`

Redux must not store:
- Employee list/detail API responses.
- Form values.
- Popup open/closed state.
- Raw tokens, refresh tokens, passwords, secrets, API keys, or credentials.

## TanStack Query
TanStack Query owns server state.

Employee query keys:

```text
['employees', queryState]
['employees', id]
['departments', 'options']
```

Rules:
- Query keys must be stable and serializable.
- Query hooks own `enabled` conditions.
- Mutations invalidate affected queries on success.
- Department query is blocked until Department spec/API is approved.
- Do not manually copy query data into Redux.

## React Hook Form
React Hook Form owns form state.

Used by:
- Employee create page.
- Employee edit page.
- Login page.
- Forgot Password page.
- Change Password page.

Rules:
- Use Zod resolver for validation.
- Use `setError` for API field errors.
- Use `reset()` when edit detail data is loaded.
- Do not store form values in Redux.
- Confirm popup should submit captured pending payload where page specs require confirmation.
- Password form values must not be stored in Redux, URL params, TanStack Query cache, or logs.

## Local React State
Use local state for component-only UI state.

Examples:
- `isSubmitConfirmOpen`
- `pendingSubmitPayload`
- `pendingUpdatePayload`
- `changedFieldsReview`
- `selectedDeleteEmployee`
- `deleteConfirmError`
- Table filter/search state when URL sync is not approved.

Rules:
- Clear local state naturally on unmount.
- Do not promote local state to Redux unless multiple distant parts of the app must read/write it.
- Keep selected delete employee local to the page that opened the popup.

## URL Search Params
URL search params may own list query state only after approval.

Possible params:
- `page`
- `limit`
- `search`
- `departmentId`
- `status`
- `sortBy`
- `sortOrder`

Rules:
- Validate params before API request.
- Invalid params must not call API.
- Department/status params remain blocked until their specs are approved.

## Cache Invalidation
Create success:
- Invalidate `['employees']`.
- Optionally set detail cache if response includes created employee.

Update success:
- Invalidate `['employees']`.
- Invalidate or set `['employees', id]`.

Delete success:
- Invalidate `['employees']`.
- Remove or invalidate `['employees', id]` when deleting from detail page.

Login success:
- Store safe authenticated user in Redux.
- Initialize permissions through PermissionProvider.
- Do not store raw token in Redux.

Forgot password success:
- Store only safe local success state.
- Do not store reset request data globally.

Change password success:
- Reset password fields.
- Follow approved session invalidation behavior if backend requires it.

Rules:
- Do not clear the whole query cache for a single employee mutation.
- Do not clear auth or permission state during employee mutations.

## Loading And Pending State
- Query loading states render skeletons or loading indicators in wrap content.
- Mutation pending states disable duplicate actions.
- Confirm popup buttons must be disabled while their mutation is pending.
- Auth/permission loading states are handled by guards and providers.

## Error State
- Query errors render page-level retry state.
- Mutation field errors map to form fields when possible.
- Mutation non-field errors render near actions or inside confirm popup.
- Do not expose stack trace or raw backend error object.

## Security
- Never store passwords, JWTs, refresh tokens, secrets, API keys, credentials, or unnecessary sensitive data in Redux, TanStack Query, local state, URL params, or logs.
- Avoid putting sensitive values in route/search params.
- Clear auth and permission state on logout.

## Test Notes
- Test reducers and selectors for auth/permission slices.
- Test query invalidation behavior for create/update/delete hooks.
- Test form API error mapping.
- Test local popup state behavior in page/component tests.

## Pending Decisions
- Whether employee list filters sync to URL.
- Query stale time/cache time values.
- Permission state source and shape.
- Exact user object shape.
