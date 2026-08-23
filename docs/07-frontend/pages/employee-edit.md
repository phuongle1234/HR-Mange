---
id: FRONTEND-EMPLOYEE-EDIT
type: frontend
module: employee
status: draft
depends_on:
  - UI-EMPLOYEE-EDIT
  - API-EMPLOYEE-DETAIL
  - API-EMPLOYEE-UPDATE
  - FRONTEND-REACT-ROUTE
  - FRONTEND-AUTH-PROVIDER
  - FRONTEND-API-CLIENT
---

# Employee Edit

## Purpose
Define the React page-level behavior for editing an employee. Route structure, layout, route guards, and provider tree are defined in `docs/07-frontend/react-route.md` and `docs/07-frontend/providers/auth-provider.md`.

## Route Reference
```text
/employees/:id/edit -> EmployeeEditPage
```

Route-level decisions:
- Layout: `AppLayout`.
- Auth guard: required through `AuthProvider`.
- Navbar title: `Edit Employee`.
- Navbar back target: `/employees/:id`, fallback `/employees`.

## Page Component
```text
src/features/employee/pages/EmployeeEditPage.tsx
```

Page responsibilities:
- Render form described by `UI-EMPLOYEE-EDIT`.
- Read route param `id`.
- Fetch existing employee detail before form reset.
- Manage form state with React Hook Form.
- Validate form data with Zod resolver before submit.
- Open submit confirm popup after valid submit intent.
- Call update employee mutation only after popup confirmation.
- Map API errors to field-level or form-level errors.
- Invalidate employee list and detail queries after successful update.
- Show update success with `react-toastify` at top-right.

## Hooks
| Hook | Purpose |
| --- | --- |
| `useAuth()` | Read `authStatus` and `currentUser`. |
| `useParams()` | Read employee `id` route param. |
| `useNavigate()` | Navigate on cancel, back, and success. |
| `useEmployeeDetailQuery(id)` | Fetch existing employee detail. |
| `useUpdateEmployeeMutation()` | Submit `PUT /api/employees/:id`. |
| `useForm()` from React Hook Form | Own form values, touched state, dirty state, validation state, and submit state. |
| `zodResolver(employeeEditSchema)` | Connect Zod schema validation to React Hook Form. |

## useEffect Design
| Effect | Dependency | Purpose |
| --- | --- | --- |
| Auth readiness effect | `authStatus` | Avoid queries/actions until auth is authenticated. |
| Detail-to-form reset effect | `employeeDetailQuery.data` | Call React Hook Form `reset(mappedEmployeeValues)` after detail load succeeds. |
| Dirty form warning effect | `isDirty` | Register leave confirmation behavior if implementation requires it. |
| Cleanup effect | unmount | Let form state clear naturally; do not clear auth, permission, or employee query cache. |

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| Auth state | `AuthProvider` / Redux global state | Page reads through `useAuth()`. |
| Employee detail data | TanStack Query | Server state used to initialize form. |
| Form values | React Hook Form | Do not store in Redux. |
| Field errors | React Hook Form + Zod resolver | API validation errors can be mapped with `setError`. |
| Form-level error message | React Hook Form/root error or local UI state | Display below submit button. |
| Submit confirm popup open state | Local React state | Open only after `handleSubmit` returns valid changed values. |
| Pending update payload | Local React state or React Hook Form snapshot | Store normalized changed-field payload for confirmation; clear after cancel, success, or field-level API error. |
| Changed-fields review model | Local derived state | Shows previous and new values in the popup. |
| Confirm popup error message | Local React state or React Hook Form/root error | Show only for non-field update failure after confirmation. |
| Update mutation status | TanStack Mutation | Use `isPending`, `isSuccess`, `isError`. |
| Toast message | react-toastify | Success toast appears at top-right. |

## Query State
Detail query:

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
Mutation hook:

```text
useUpdateEmployeeMutation()
```

API service:

```text
EmployeeApiService.update(id, payload)
```

On success:
- Invalidate `['employees']` query.
- Invalidate or set `['employees', id]` query.
- Show success toast with `react-toastify` at top-right.
- Close submit confirm popup.
- Clear pending update payload, changed-fields review model, and popup error state.
- Navigate according to pending success rule.

On error:
- `EMPLOYEE_CODE_EXISTS`: map to `employeeCode` field.
- `EMPLOYEE_EMAIL_EXISTS`: map to `email` field.
- `EMPLOYEE_NOT_FOUND`: show not found/page-level error.
- `VALIDATION_ERROR`: map field errors returned by API.
- `UNAUTHORIZED`: clear token and redirect to `/login`.
- For field-level errors returned after popup confirmation, close the popup and focus the first invalid field.
- For non-field errors returned after popup confirmation, keep the popup open and show a safe form-level message inside the popup.

## Form Library And Validation
React Hook Form and Zod are required for this page.

Required libraries:

```text
react-hook-form
zod
@hookform/resolvers/zod
react-toastify
```

Form setup:

```text
useForm({
  resolver: zodResolver(employeeEditSchema),
  mode: "onBlur",
  reValidateMode: "onChange",
  defaultValues
})
```

Zod schema:
- Schema name: `employeeEditSchema`.
- Validates optional update fields when provided.
- Validates email format when provided.
- Validates trim/non-empty rules where applicable.
- Does not perform uniqueness checks; uniqueness remains API/DTO/custom validation responsibility.

## Local Form State
Track through React Hook Form:
- `formState.errors`
- `formState.touchedFields`
- `formState.dirtyFields`
- `formState.isDirty`
- `formState.isValid`
- `formState.isSubmitting`
- `watch()` values when UI behavior needs current field values

Track through local state:
- `isSubmitConfirmOpen`
- `pendingUpdatePayload`
- `changedFieldsReview`
- `submitConfirmError`

Client validation:
- `mode: "onBlur"` means field validation runs when the field loses focus.
- `reValidateMode: "onChange"` means an invalid field can be revalidated while user edits it.
- Uniqueness checks remain API/DTO/custom validation responsibility.

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `register(field)` | React Hook Form registers field value, blur, change, and validation behavior. |
| `handleBlur(field)` | Use React Hook Form registered `onBlur` behavior to mark field touched and trigger Zod field validation. Do not manually duplicate validation logic outside Zod. |
| `handleSubmit(onValid, onInvalid)` | React Hook Form validates with Zod, calls `onValid` when valid, and `onInvalid` when validation fails. |
| `onValid(values)` | Build normalized changed-field payload, build changed-fields review model, store both, clear `submitConfirmError`, and open submit confirm popup. Do not call mutation here. |
| `handleCloseSubmitConfirm()` | Close popup and clear popup error when mutation is not pending; keep form values unchanged. |
| `handleConfirmUpdate()` | Call `useUpdateEmployeeMutation()` with `pendingUpdatePayload`; prevent duplicate calls while mutation is pending. |
| `handleCancel()` | Navigate to `/employees/:id` if clean; show confirm leave dialog if dirty. |
| `handleBack()` | Same behavior as cancel/back navigation. |
| `mapApiErrorToForm(error)` | Convert API error codes to React Hook Form `setError` calls or root/form-level error. |
| `buildUpdateEmployeePayload(values, dirtyFields)` | Trim, normalize, and include changed values before mutation. |
| `mapEmployeeToFormValues(employee)` | Convert detail API response to form values for `reset()`. |
| `buildChangedFieldsReview(payload, employeeDetail)` | Build previous/new value rows for the submit confirm popup. |

## Submit Confirm Popup Behavior
The submit confirm popup is required for this page.

Open flow:
```text
User clicks Save Changes
    ↓
React Hook Form handleSubmit validates with Zod
    ↓
onValid builds normalized changed-field payload
    ↓
If payload is empty, show no-change feedback and do not open popup
    ↓
Store pendingUpdatePayload and changedFieldsReview
    ↓
Open submit confirm popup
```

Confirm flow:
```text
User clicks Confirm update
    ↓
Guard id and pendingUpdatePayload exist
    ↓
Call updateEmployeeMutation.mutateAsync({ id, payload: pendingUpdatePayload })
    ↓
On success, invalidate ['employees'] and ['employees', id], show toast, close popup, clear pending payload
```

Cancel flow:
```text
User clicks Cancel or presses Escape
    ↓
If mutation is not pending, close popup
    ↓
Keep form values, dirty state, and field errors unchanged
```

Implementation requirements:
- Use an accessible dialog/modal component from the approved UI layer if available; otherwise implement dialog semantics directly.
- The popup receives review rows from `changedFieldsReview`.
- Do not re-read mutable form state inside `handleConfirmUpdate`; submit the captured pending payload the user reviewed.
- Disable popup close, Cancel, and Confirm update while `updateEmployeeMutation.isPending` is true.
- Use `updateEmployeeMutation.isPending` for the Confirm update loading state.
- On non-field mutation error, keep the popup open and render `submitConfirmError`.
- On field-level mutation error, close the popup, clear pending payload, map errors with `setError`, and focus the first invalid field.

## Error Message Rendering
Field-level errors:
- Render each field error directly under its input.
- Use message from Zod or API error mapping.

Form-level error:
- Render root/form-level error message below the submit button.
- Examples: unexpected API error, not found state, or unknown server error.
- Do not render raw backend error object.

Submit button area:

```text
[Save Changes button]
[Cancel button]
<Form-level error message below buttons when exists>
```

Submit confirm popup area:

```text
<Changed fields summary>
[Cancel button]
[Confirm update button]
<Submit confirm error message when exists>
```

## Success Toast
Use `react-toastify` after update succeeds.

```text
toast.success("Employee updated successfully.", {
  position: "top-right"
})
```

## Render Flow
```text
Route guard passes
    ↓
EmployeeEditPage mounted inside AppLayout WrapContent
    ↓
Read id from route params
    ↓
Fetch employee detail query when enabled
    ↓
Reset React Hook Form values after detail load succeeds
    ↓
User edits form values
    ↓
React Hook Form triggers Zod validation on blur and revalidation on change
    ↓
React Hook Form handleSubmit validates with Zod
    ↓
Valid submit opens submit confirm popup with changed-fields review
    ↓
User confirms update
    ↓
Update mutation calls EmployeeApiService.update(id, pendingUpdatePayload)
    ↓
Success invalidates employee list/detail queries
    ↓
Show top-right success toast
    ↓
Navigate or stay based on pending success decision
```

## Cleanup
- Local form state clears by unmount.
- Submit confirm popup state and pending update payload clear by unmount.
- Do not clear `['employees']` cache.
- Do not clear `['employees', id]` unless update/delete behavior requires invalidation.
- Do not clear auth global state.

## Pending Decisions
None blocking. Success navigates back to `/employees/:id`. Toast duration/styling is an implementation default.
