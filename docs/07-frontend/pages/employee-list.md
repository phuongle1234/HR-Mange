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
- Permission: `employee.read`.
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

## Hooks
| Hook | Purpose |
| --- | --- |
| `useAuth()` | Read `authStatus` and `currentUser`. |
| `useNavigate()` | Navigate to create/detail/edit pages. |
| `useEmployeesQuery(queryState)` | Fetch `GET /api/employees`. |
| `useDeleteEmployeeMutation()` | Submit `DELETE /api/employees/:id`. |
| `useSearchParams()` | Optional sync for page/search/filter query params. |

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
| Permission state | `PermissionProvider` / global state | Controls UI only; backend remains final boundary. |
| Search/filter/page state | Local state or URL search params | Do not store in Redux. |
| Employee list data | TanStack Query | Server state, not Redux. |
| Delete confirm popup state | Local state | Stores selected employee for confirmation. |
| Selected delete employee | Local state | Holds the row employee being reviewed in the popup. |
| Delete confirm error message | Local state | Shows safe non-field delete error inside the popup. |
| Delete mutation state | TanStack Mutation | Use `isPending`, `isSuccess`, `isError`. |
| Toast message | react-toastify | Success toast appears at top-right. |

## Query State
Query hook:

```text
useEmployeesQuery(queryState)
```

Query key:

```text
['employees', queryState]
```

Enabled condition:

```text
authStatus === 'authenticated'
```

Query params:
- `page`
- `limit`
- `search`
- `status`
- `sortBy`
- `sortOrder`

There is no `departmentId` filter — Department was removed from scope (`WORK-000` decision #1).

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
Read auth and permission context
    ↓
Initialize local query state
    ↓
TanStack Query fetches employees when enabled
    ↓
Render loading / error / empty / success table state
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
