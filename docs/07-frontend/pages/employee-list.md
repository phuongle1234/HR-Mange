---
id: FRONTEND-EMPLOYEE-LIST
type: frontend
module: employee
status: draft
depends_on:
  - UI-EMPLOYEE-LIST
  - API-EMPLOYEE-LIST
  - API-EMPLOYEE-BULK-DELETE
  - API-INVITATIONS-CREATE
  - FRONTEND-REACT-ROUTE
  - FRONTEND-AUTH-PROVIDER
  - FRONTEND-API-CLIENT
  - FRONTEND-STATE-MANAGEMENT
---

# Employee List

## Purpose
Define the React page-level behavior for listing employees. Route structure, layout, route guards, and provider tree are defined in `docs/07-frontend/react-route.md` and `docs/07-frontend/providers/auth-provider.md`.

## 2026-08-26 Daily Task Changes (task §6-§7)
This page gains checkbox multi-select and a right-click context menu, mirroring `FRONTEND-ORGANIZATION-TYPE-LIST` exactly:
- Per-row `Edit` and `Delete` action buttons are **removed** — bulk selection + context menu is now the only way to update or delete employees (see `FRONTEND-EMPLOYEE-EDIT` for the update page this hands off to). The per-row `Detail` link is kept (a read-only view is unaffected by "bulk" semantics).
- New context menu item `Invite User`, calling `POST /api/invitations` with the checked employee ids (task §7). Disabled when no row is checked.
- The old single-row delete confirm popup flow (below, superseded) is replaced by a bulk delete flow using the checked ids, same shape as `FRONTEND-ORGANIZATION-TYPE-LIST`'s Delete Flow.

## Route Reference
```text
/employees -> EmployeeListPage
```

Route-level decisions:
- Layout: `AppLayout`.
- Auth guard: required through `AuthProvider`.
- Permission model: none; no `PermissionGuard` or permission checks are enforced in this phase.
- Navbar title: `Employees`.
- Navbar back button: hidden.

## Page Component
```text
src/features/employee/pages/EmployeeListPage.tsx
```

Page responsibilities:
- Render table and toolbar described by `UI-EMPLOYEE-LIST`.
- Read auth readiness from `useAuth()`.
- Read permissions for read/create/update/delete actions.
- Manage filter/search/pagination UI state locally.
- Fetch employees with TanStack Query.
- Manage row checkbox selection locally, including header check-all/indeterminate state.
- Open a reusable context menu from right-click, offering Create/Update/Delete/Invite User.
- Open delete confirm popup before bulk deletion.
- Delete checked employees with mutation only after popup confirmation.
- Call `POST /api/invitations` with checked employee ids from the context menu's Invite User action.
- Show delete/invite success with `react-toastify` at top-right.
- Navigate to create/detail/update pages.

## Hooks / Shared Components
| Hook / Component | Purpose |
| --- | --- |
| `useAuth()` | Read `authStatus` and `currentUser`. |
| `useNavigate()` | Navigate to create/detail/update pages. |
| `useQuery()` + `employeeApiService.list(queryState)` | Fetch `GET /api/employees`. |
| `useBulkDeleteEmployeesMutation()` | Submit `DELETE /api/employees/bulk`. |
| `useCreateInvitationsMutation()` | Submit `POST /api/invitations`. |
| `SearchAndFilterBar` | Shared search input + optional custom filter slot + create action. |
| `SortableTableHeader` | Shared sortable header for sortable columns only. |
| `useListQueryState` | Shared search/page/limit/sort state and handlers. |
| `useDebounce` | Debounced search value for API query input, implemented with `lodash.debounce`. |
| `Pagination` | Shared list pagination UI built on MUI `Pagination`, with page conversion from app 1-based indexing to MUI's 0-based page index. |
| `ResponsiveGrid` | Shared reusable layout grid for list/filter toolbars. |
| `ContextMenu` | Shared right-click menu — same component `FRONTEND-ORGANIZATION-TYPE-LIST` uses. |
| `useSearchParams()` | Optional sync for page/search/filter query params; not required for the current implementation. |

## useEffect Design
| Effect | Dependency | Purpose |
| --- | --- | --- |
| Auth readiness effect | `authStatus` | Avoid list query until auth is authenticated. Redirect is handled by route guard. |
| Query param sync effect | `searchParams` | Initialize local query state from URL if URL sync is approved. |
| Cleanup effect | unmount | Do not clear employee query cache; clear only local delete confirm popup state naturally. |

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| Auth state | `AuthProvider` / Redux global state | Page reads through `useAuth()`. |
| Permission state | Not implemented | There is no `PermissionProvider` and no permission checks in this phase. |
| Search/filter/page/limit/sort state | `useListQueryState` plus local status state | Shared hook owns common list state; status filter remains page-specific local state and resets page to `1` on change. |
| Employee list data | TanStack Query | Server state, not Redux. |
| Checked ids on list | Local React state | Do not store in Redux while merely checking rows — same rule as `FRONTEND-ORGANIZATION-TYPE-LIST`. |
| Checked ids for update handoff | Redux Toolkit | Store under dedicated key `employee_checked` right before navigating to `/employees/update`. |
| Delete confirm popup state | Local state | Open only when checked ids exist. |
| Delete confirm error message | Local state | Shows safe non-field delete error inside the popup. |
| Bulk delete mutation state | TanStack Mutation | Use `isPending`, `isSuccess`, `isError`. |
| Invite mutation state | TanStack Mutation | Use `isPending`, `isSuccess`, `isError`. |
| Context menu open/position | `ContextMenu` local state | Shared component owns menu mechanics. |
| Toast message | react-toastify | Success toast appears at top-right. |

## Query State
Query key pattern:

```text
employeeQueryKeys.list(queryState)
```

Current implementation uses `useQuery` directly in the page and the key is built through the feature query-key helper, not a custom hook.

Current query-state fields:
- `page`
- `limit`
- `search`
- `status`
- `sortBy`
- `sortOrder`

There is no `departmentId` filter — Department was removed from scope (`WORK-000` decision #1).

The toolbar is built with the shared `SearchAndFilterBar` component, which accepts a custom filter slot for the status select, includes the shared limit selector, and keeps the search field generic across list pages.

The page must use `useListQueryState` for shared `search`, `page`, `limit`, `sortBy`, and `sortOrder` behavior. Search sent to the API is debounced with `useDebounce(search, 500)`.

Sortable columns:
- `employeeCode`
- `createdAt`

Non-sortable columns:
- full name
- email
- phone
- position
- status
- actions

Sort behavior:
- Sortable headers use shared `SortableTableHeader`.
- Clicking the active sortable header toggles `asc`/`desc`.
- Clicking a different sortable header changes `sortBy` and starts with `asc`.
- Sorting resets `page` to `1`.
- The table `thead` stays sticky at the top of the scroll container during vertical scroll.

## Table Rendering Pattern
The table gains a leading checkbox column (header check-all/indeterminate + per-row checkbox) and drops the old per-row Edit/Delete action buttons, keeping only a `Detail` link. Column count changes from `8` to `9` (`checkbox, employeeCode, fullName, email, phone, position, status, createdAt, actions`):

```tsx
<table>
  <thead>
    <tr>
      <th><input type="checkbox" checked={allChecked} ref={(el) => el && (el.indeterminate = someChecked && !allChecked)} onChange={handleToggleCheckAll} /></th>
      ...
    </tr>
  </thead>
  <tbody onContextMenu={handleContextMenu}>
        {isLoading && (
      <tr>
        <td colSpan={9}>
          <LoadingState label="Loading employees..." />
        </td>
      </tr>
    )}

    {!isLoading && employees.length === 0 && (
      <tr>
        <td colSpan={9}>
          <EmptyState label="No employees found." />
        </td>
      </tr>
    )}

    {employees.map((employee) => (
      <tr key={employee.id}>
        <td><input type="checkbox" checked={checkedIds.includes(employee.id)} onChange={() => handleToggleRow(employee.id)} /></td>
        ...
      </tr>
    ))}
  </tbody>
</table>
```

This is the approved rendering pattern for this page. Loading and empty states must stay inside `tbody`, after `thead`, so the table remains valid HTML and the row count / column span stays consistent.

## Context Menu
Open source:
- `onContextMenu` on the table container.

Items:

| Key | Label | Enabled When | Behavior |
| --- | --- | --- | --- |
| `create` | Create | always | Navigate to `/employees/create`. |
| `update` | Update | at least one id checked | Dispatch `{ field: 'employee_checked', value: checkedIds }`, then navigate to `/employees/update`. |
| `delete` | Delete | at least one id checked | Open delete confirmation popup. |
| `invite` | Invite User | at least one id checked | Call `useCreateInvitationsMutation()` with `{ employeeIds: checkedIds }` (task §7, explicit: disabled/no-op with an empty selection). |

## Delete Flow
```text
User checks rows
    ↓
User right-clicks table and selects Delete
    ↓
ConfirmDialog opens
    ↓
User confirms
    ↓
DELETE /api/employees/bulk with { ids: checkedIds }
    ↓
Invalidate ['employees']
    ↓
Clear local checked ids
```

## Invite Flow
```text
User checks rows
    ↓
User right-clicks table and selects Invite User
    ↓
POST /api/invitations with { employeeIds: checkedIds }
    ↓
Show top-right toast summarizing created/skipped counts (API-INVITATIONS-CREATE)
    ↓
Clear local checked ids
```
No confirm popup is specified for invite (unlike delete) — the daily task's flow (§7) goes straight from context-menu selection to the API call. This does not invalidate `['employees']` (see `API-INVITATIONS-CREATE`'s Frontend Contract Notes — inviting doesn't change any list-visible field).

## Mutation State
Bulk delete mutation hook:

```text
useBulkDeleteEmployeesMutation()
```

On success:
- Invalidate `['employees']` queries.
- Close delete confirm popup.
- Clear checked ids and delete confirm error.
- Show success toast at top-right.

On error:
- Keep delete confirm popup open.
- Show form/page-level error below delete confirm popup action buttons.
- Do not render raw backend error object.

Invite mutation hook:

```text
useCreateInvitationsMutation()
```

On success: show a toast summarizing `created`/`skipped` counts (`API-INVITATIONS-CREATE`), clear checked ids. On error: show a safe toast/error message; checked ids remain (no destructive local state to roll back).

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `handleSearchChange(value)` | Update local search value; debounce behavior pending approval. |
| `handleFilterChange(field, value)` | Update filter state and reset page to first page. |
| `handlePageChange(page)` | Update current page. |
| `handleLimitChange(limit)` | Update page size through `useListQueryState` and reset page to first page. |
| `handleSortChange(field)` | Update sortable field/order through `useListQueryState` and reset page to first page. |
| `handleToggleRow(employeeId)` | Toggle one row's checked state locally. |
| `handleToggleCheckAll()` | Check/uncheck all currently visible rows; indeterminate when some but not all are checked. |
| `handleContextMenu(event)` | Open `ContextMenu` at the cursor position. |
| `handleCreate()` | Navigate to `/employees/create`. |
| `handleView(employeeId)` | Navigate to `/employees/:id`. |
| `handleRequestUpdate()` | Dispatch checked ids to Redux `employee_checked`, navigate to `/employees/update`. |
| `handleRequestDelete()` | Clear delete confirm error and open delete confirm popup (guarded on at least one checked id). |
| `handleConfirmDelete()` | Call bulk delete mutation with checked ids; prevent duplicate calls while mutation is pending. |
| `handleCancelDelete()` | Close delete confirm popup when mutation is not pending. |
| `handleInvite()` | Call invite mutation with checked ids (guarded on at least one checked id). |

## Delete Confirm Popup Behavior
The delete confirm popup is required for this page, now scoped to the checked-ids array instead of a single row.

Open flow:
```text
User checks rows and selects Delete from the context menu
    ↓
Clear deleteConfirmError
    ↓
Open delete confirm popup
```

Confirm flow:
```text
User clicks Confirm delete
    ↓
Guard checkedIds is non-empty
    ↓
Call bulkDeleteEmployeesMutation.mutateAsync(checkedIds)
    ↓
On success, invalidate ['employees'], show toast, close popup, clear checked ids
```

Cancel flow:
```text
User clicks Cancel or presses Escape
    ↓
If mutation is not pending, close popup
```

Implementation requirements:
- Use an accessible dialog/modal component from the approved UI layer if available; otherwise implement dialog semantics directly.
- The popup receives a summary derived from the checked rows (e.g. count, or a short list of names).
- Disable popup close, Cancel, and Confirm delete while `bulkDeleteEmployeesMutation.isPending` is true.
- Use `bulkDeleteEmployeesMutation.isPending` for the Confirm delete loading state.
- Confirm delete button uses destructive styling.
- Keep the popup open and render `deleteConfirmError` on delete failure.

## Error Message Rendering
List-level errors:
- Render query error in wrap content with retry action.
- Do not expose raw backend error object.

Delete confirm popup errors:
- Render root/delete error message below confirm/cancel buttons.
- Do not expose raw backend error object.

Invite errors:
- Render as a safe toast; do not expose raw backend error object.

## Success Toast
Use `react-toastify` after delete/invite succeeds.

```text
toast.success("Employees deleted successfully.", {
  position: "top-right"
})
toast.success(`Invited ${created.length} employee(s), skipped ${skipped.length}.`, {
  position: "top-right"
})
```

## Render Flow
```text
Route guard passes
    ↓
EmployeeListPage mounted inside AppLayout WrapContent
    ↓
Read auth state from `AuthProvider`
    ↓
Initialize local query state
    ↓
TanStack Query fetches employees when enabled
    ↓
Render loading / error / empty / success table state with valid table structure, checkbox column included
    ↓
User changes filters or pagination
    ↓
Query key changes and list refetches
    ↓
User checks rows and right-clicks the table
    ↓
ContextMenu opens with Create/Update/Delete/Invite User
    ↓
Update -> dispatch employee_checked, navigate to /employees/update
Delete -> confirm popup -> DELETE /api/employees/bulk -> invalidate ['employees']
Invite User -> POST /api/invitations -> toast summary
```

## Cleanup
- Clear checked ids and delete confirm popup state on unmount naturally.
- Do not clear `['employees']` cache.
- Do not clear auth or permission global state.

## Pending Decisions
None blocking. Search debounce timing, pagination default page size, and toast duration/styling are implementation defaults, not separately user-confirmed. Whether an Organization column/filter should be added to this list table is not specified by the daily task and is left out of this contract's scope (see `FRONTEND-EMPLOYEE-CREATE`'s Ambiguities for the same note on the Detail page).
