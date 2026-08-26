---
id: FRONTEND-EMPLOYEE-LIST
type: frontend
module: employee
status: draft
depends_on:
  - UI-EMPLOYEE-LIST
  - API-EMPLOYEE-LIST
  - API-EMPLOYEE-DELETE
  - FRONTEND-REACT-ROUTE
  - FRONTEND-AUTH-PROVIDER
  - FRONTEND-API-CLIENT
---

# Employee List

## Purpose
Define the React page-level behavior for listing employees. Route structure, layout, route guards, and provider tree are defined in `docs/07-frontend/react-route.md` and `docs/07-frontend/providers/auth-provider.md`.

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
- Open delete confirm popup before deletion.
- Delete employee with mutation only after popup confirmation.
- Show delete success with `react-toastify` at top-right.
- Navigate to create/detail/edit pages.

## Hooks / Shared Components
| Hook / Component | Purpose |
| --- | --- |
| `useAuth()` | Read `authStatus` and `currentUser`. |
| `useNavigate()` | Navigate to create/detail/edit pages. |
| `useQuery()` + `employeeApiService.list(queryState)` | Fetch `GET /api/employees`. |
| `useDeleteEmployeeMutation()` | Submit `DELETE /api/employees/:id`. |
| `SearchAndFilterBar` | Shared search input + optional custom filter slot + create action. |
| `SortableTableHeader` | Shared sortable header for sortable columns only. |
| `useListQueryState` | Shared search/page/limit/sort state and handlers. |
| `useDebounce` | Debounced search value for API query input, implemented with `lodash.debounce`. |
| `Pagination` | Shared list pagination UI built on MUI `Pagination`, with page conversion from app 1-based indexing to MUI's 0-based page index. |
| `ResponsiveGrid` | Shared reusable layout grid for list/filter toolbars. |
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
| Delete confirm popup state | Local state | Stores selected employee for confirmation. |
| Selected delete employee | Local state | Holds the row employee being reviewed in the popup. |
| Delete confirm error message | Local state | Shows safe non-field delete error inside the popup. |
| Delete mutation state | TanStack Mutation | Use `isPending`, `isSuccess`, `isError`. |
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
The current implementation renders list semantics inside a valid HTML table structure:

```tsx
<table>
  <thead>...</thead>
  <tbody>
        {isLoading && (
      <tr>
        <td colSpan={8}>
          <LoadingState label="Loading employees..." />
        </td>
      </tr>
    )}

    {!isLoading && employees.length === 0 && (
      <tr>
        <td colSpan={8}>
          <EmptyState label="No employees found." />
        </td>
      </tr>
    )}

    {employees.map((employee) => (
      <tr key={employee.id}>...</tr>
    ))}
  </tbody>
</table>
```

This is the approved rendering pattern for this page. Loading and empty states must stay inside `tbody`, after `thead`, so the table remains valid HTML and the row count / column span stays consistent.

## Mutation State
Delete mutation hook:

```text
useDeleteEmployeeMutation()
```

On success:
- Invalidate `['employees']` queries.
- Close delete confirm popup.
- Clear selected delete employee and delete confirm error.
- Show success toast at top-right.

On error:
- Keep delete confirm popup open.
- Show form/page-level error below delete confirm popup action buttons.
- Do not render raw backend error object.

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `handleSearchChange(value)` | Update local search value; debounce behavior pending approval. |
| `handleFilterChange(field, value)` | Update filter state and reset page to first page. |
| `handlePageChange(page)` | Update current page. |
| `handleLimitChange(limit)` | Update page size through `useListQueryState` and reset page to first page. |
| `handleSortChange(field)` | Update sortable field/order through `useListQueryState` and reset page to first page. |
| `handleCreate()` | Navigate to `/employees/create`. |
| `handleView(employeeId)` | Navigate to `/employees/:id`. |
| `handleEdit(employeeId)` | Navigate to `/employees/:id/edit`. |
| `handleRequestDelete(employee)` | Store selected employee, clear delete confirm error, and open delete confirm popup. |
| `handleConfirmDelete()` | Call delete mutation for selected employee; prevent duplicate calls while mutation is pending. |
| `handleCancelDelete()` | Close delete confirm popup and clear selected employee when mutation is not pending. |

## Delete Confirm Popup Behavior
The delete confirm popup is required for this page.

Open flow:
```text
User clicks row Delete action
    ↓
Store selectedDeleteEmployee
    ↓
Clear deleteConfirmError
    ↓
Open delete confirm popup
```

Confirm flow:
```text
User clicks Confirm delete
    ↓
Guard selectedDeleteEmployee exists
    ↓
Call deleteEmployeeMutation.mutateAsync(selectedDeleteEmployee.id)
    ↓
On success, invalidate ['employees'], show toast, close popup, clear selected employee
```

Cancel flow:
```text
User clicks Cancel or presses Escape
    ↓
If mutation is not pending, close popup
    ↓
Clear selectedDeleteEmployee
```

Implementation requirements:
- Use an accessible dialog/modal component from the approved UI layer if available; otherwise implement dialog semantics directly.
- The popup receives employee summary values from `selectedDeleteEmployee`.
- Disable popup close, Cancel, and Confirm delete while `deleteEmployeeMutation.isPending` is true.
- Use `deleteEmployeeMutation.isPending` for the Confirm delete loading state.
- Confirm delete button uses destructive styling.
- Keep the popup open and render `deleteConfirmError` on delete failure.

## Error Message Rendering
List-level errors:
- Render query error in wrap content with retry action.
- Do not expose raw backend error object.

Delete confirm popup errors:
- Render root/delete error message below confirm/cancel buttons.
- Do not expose raw backend error object.

## Success Toast
Use `react-toastify` after delete succeeds.

```text
toast.success("Employee deleted successfully.", {
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
Render loading / error / empty / success table state with valid table structure
    ↓
User changes filters or pagination
    ↓
Query key changes and list refetches
    ↓
User clicks row Delete action
    ↓
Delete confirm popup opens for selected employee
    ↓
User confirms delete
    ↓
Delete mutation succeeds
    ↓
Invalidate employees query and show top-right toast
```

## Cleanup
- Clear selected delete employee and delete confirm popup state on unmount naturally.
- Do not clear `['employees']` cache.
- Do not clear auth or permission global state.

## Pending Decisions
None blocking. Search debounce timing, pagination default page size, and toast duration/styling are implementation defaults, not separately user-confirmed.
