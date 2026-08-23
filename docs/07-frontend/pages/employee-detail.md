---
id: FRONTEND-EMPLOYEE-DETAIL
type: frontend
module: employee
status: draft
depends_on:
  - UI-EMPLOYEE-DETAIL
  - API-EMPLOYEE-DETAIL
  - API-EMPLOYEE-DELETE
  - FRONTEND-REACT-ROUTE
  - FRONTEND-AUTH-PROVIDER
  - FRONTEND-API-CLIENT
---

# Employee Detail

## Purpose
Define the React page-level behavior for viewing an employee detail page.

## Route Reference
```text
/employees/:id -> EmployeeDetailPage
```

Route-level decisions:
- Layout: `AppLayout`.
- Auth guard: required through `AuthProvider`.
- Navbar title: `Employee Detail`.
- Navbar back target: `/employees`.

## Page Component
```text
src/features/employee/pages/EmployeeDetailPage.tsx
```

Page responsibilities:
- Render detail sections described by `UI-EMPLOYEE-DETAIL`.
- Read route param `id`.
- Fetch employee detail with TanStack Query.
- Show edit/delete actions based on permissions.
- Open delete confirm popup before deletion.
- Delete employee with mutation only after popup confirmation.
- Show delete success with `react-toastify` at top-right.
- Navigate back, edit, or list after delete.

## Hooks
| Hook | Purpose |
| --- | --- |
| `useAuth()` | Read `authStatus` and `currentUser`. |
| `useParams()` | Read employee `id` route param. |
| `useNavigate()` | Navigate back, edit, or after delete. |
| `useEmployeeDetailQuery(id)` | Fetch `GET /api/employees/:id`. |
| `useDeleteEmployeeMutation()` | Submit `DELETE /api/employees/:id`. |

## useEffect Design
| Effect | Dependency | Purpose |
| --- | --- | --- |
| Auth readiness effect | `authStatus` | Avoid detail query until auth is authenticated. Redirect is handled by route guard. |
| Invalid ID effect | `id` | If ID format is invalid, do not call API and show invalid/not found state. |
| Cleanup effect | unmount | Clear local delete confirm popup state naturally. |

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| Auth state | `AuthProvider` / Redux global state | Page reads through `useAuth()`. |
| Permission state | `PermissionProvider` / global state | Controls UI only. |
| Employee detail data | TanStack Query | Server state, not Redux. |
| Route param `id` | React Router | Input for detail query. |
| Delete confirm popup state | Local state | Stores open/closed state for current employee delete confirmation. |
| Delete confirm error message | Local state | Shows safe non-field delete error inside the popup. |
| Delete mutation state | TanStack Mutation | Used for delete action loading/error. |
| Toast message | react-toastify | Success toast appears at top-right. |

## Query State
Query hook:

```text
useEmployeeDetailQuery(id)
```

Query key:

```text
['employees', id]
```

Enabled condition:

```text
authStatus === 'authenticated'
&& isValidEmployeeId(id) === true
```

## Mutation State
Delete mutation hook:

```text
useDeleteEmployeeMutation()
```

On success:
- Invalidate `['employees']` queries.
- Remove or invalidate `['employees', id]`.
- Close delete confirm popup and clear delete confirm error.
- Show success toast at top-right.
- Navigate to `/employees`.

On error:
- Keep delete confirm popup open.
- Render root/delete error below confirm popup action buttons.
- Do not render raw backend error object.

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `handleBack()` | Navigate to `/employees`. |
| `handleEdit()` | Navigate to `/employees/:id/edit`. |
| `handleRequestDelete()` | Clear delete confirm error and open delete confirm popup for current employee. |
| `handleConfirmDelete()` | Call delete mutation for current `id`; prevent duplicate calls while mutation is pending. |
| `handleCancelDelete()` | Close delete confirm popup when mutation is not pending. |
| `handleRetry()` | Refetch employee detail query. |

## Delete Confirm Popup Behavior
The delete confirm popup is required for this page.

Open flow:
```text
User clicks Delete
    ↓
Clear deleteConfirmError
    ↓
Open delete confirm popup using current employee detail as review data
```

Confirm flow:
```text
User clicks Confirm delete
    ↓
Guard id is valid and employee detail exists
    ↓
Call deleteEmployeeMutation.mutateAsync(id)
    ↓
On success, invalidate employee queries, show toast, close popup, navigate to /employees
```

Cancel flow:
```text
User clicks Cancel or presses Escape
    ↓
If mutation is not pending, close popup
```

Implementation requirements:
- Use an accessible dialog/modal component from the approved UI layer if available; otherwise implement dialog semantics directly.
- The popup receives employee summary values from the loaded employee detail data.
- Disable popup close, Cancel, and Confirm delete while `deleteEmployeeMutation.isPending` is true.
- Use `deleteEmployeeMutation.isPending` for the Confirm delete loading state.
- Confirm delete button uses destructive styling.
- Keep the popup open and render `deleteConfirmError` on delete failure.

## Error Message Rendering
Detail query error:
- Render page-level error with retry action.
- If `EMPLOYEE_NOT_FOUND`, show not found state and action back to list.

Delete confirm popup error:
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
EmployeeDetailPage mounted inside AppLayout WrapContent
    ↓
Read id from route params
    ↓
Validate id before query
    ↓
TanStack Query fetches employee detail when enabled
    ↓
Render loading / error / not found / success detail state
    ↓
User clicks edit or delete
    ↓
Delete confirm popup opens if user clicks delete
    ↓
User confirms delete
    ↓
Delete mutation succeeds
    ↓
Invalidate employee queries, show top-right toast, navigate to list
```

## Cleanup
- Clear local delete confirm popup state by unmount.
- Do not clear auth or permission global state.
- Do not clear employee list cache.

## Pending Decisions
None blocking. Delete is a hard delete (`WORK-000` decision #3); detail reads are not audited. Toast duration/styling is an implementation default.
