---
id: FRONTEND-EMPLOYEE-CREATE
type: frontend
module: employee
status: draft
depends_on:
  - UI-EMPLOYEE-CREATE
  - API-EMPLOYEE-CREATE
  - FRONTEND-REACT-ROUTE
  - FRONTEND-AUTH-PROVIDER
  - FRONTEND-API-CLIENT
---

# Employee Create

## Purpose
Define the React page-level behavior for creating an employee. Route structure, layout, route guards, and provider tree are defined in `docs/07-frontend/react-route.md` and `docs/07-frontend/providers/auth-provider.md`.

## Route Reference
This page is rendered by route:

```text
/employees/create -> EmployeeCreatePage
```

Route-level decisions:
- Layout: `AppLayout`.
- Auth guard: required through `AuthProvider`.
- Navbar title: `Create Employee`.
- Navbar back target: `/employees`.

Do not redefine route/provider behavior inside this page spec. This page spec only defines page lifecycle, state, hooks, handlers, and API interaction.

## Page Component
Proposed file:

```text
src/features/employee/pages/EmployeeCreatePage.tsx
```

Page responsibilities:
- Render form described by `UI-EMPLOYEE-CREATE`.
- Read auth readiness from `useAuth()`.
- Read permission result from permission hook/provider if needed by page UI.
- Manage form state with React Hook Form.
- Validate form data with Zod resolver before submit.
- Open submit confirm popup after valid submit intent.
- Call create employee mutation only after popup confirmation.
- Map API errors to field-level or form-level errors.
- Invalidate employee list query after successful create.
- Navigate after success according to pending decision.

## Hooks
| Hook | Purpose |
| --- | --- |
| `useAuth()` | Read `authStatus` and `currentUser`; provided by `AuthProvider`. |
| `useNavigate()` | Navigate on cancel, back, and success. |
| `useCreateEmployeeMutation()` | Submit `POST /api/employees`. |
| `useForm()` from React Hook Form | Own form values, touched state, dirty state, validation state, and submit state. |
| `zodResolver(employeeCreateSchema)` | Connect Zod schema validation to React Hook Form. |

## useEffect Design
Effects should be limited to UI lifecycle concerns. Data fetching should use TanStack Query instead of manual `useEffect` when possible.

| Effect | Dependency | Purpose |
| --- | --- | --- |
| Auth readiness effect | `authStatus` | Avoid page actions until auth check is complete. Redirect is normally handled by route guard. |
| Dirty form warning effect | `isDirty` | Register leave confirmation behavior if implementation requires it. |
| Cleanup effect | unmount | Let local state clear naturally; do not clear auth, permission, or employee list cache. |

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| Auth state | `AuthProvider` / global client state | Page reads through `useAuth()`. |
| Form values | React Hook Form | Do not store in Redux. |
| Field errors | React Hook Form + Zod resolver | API validation errors can be mapped with `setError`. |
| Form-level error message | React Hook Form/root error or local UI state | Display below submit button. |
| Submit confirm popup open state | Local React state | Open only after `handleSubmit` returns valid values. |
| Pending submit payload | Local React state or React Hook Form snapshot | Store normalized payload for confirmation; clear after cancel, success, or field-level API error. |
| Confirm popup error message | Local React state or React Hook Form/root error | Show only for non-field create failure after confirmation. |
| Create mutation status | TanStack Mutation | Use `isPending`, `isSuccess`, `isError`. |
| Toast message | react-toastify | Success toast appears at top-right. |

## Mutation State
Mutation hook:

```text
useCreateEmployeeMutation()
```

API service:

```text
EmployeeApiService.create(payload)
```

Rules:
- Component must not hard-code `/api/employees`.
- API URL belongs in centralized endpoint config.
- Axios interceptor handles token attach, refresh, retry, and logout on refresh failure.

On success:
- Invalidate `['employees']` query.
- Optionally set `['employees', createdEmployee.id]` if response includes created employee.
- Show success toast with `react-toastify` at top-right.
- Close submit confirm popup.
- Clear pending submit payload and popup error state.
- Navigate according to pending success rule.

On error:
- `EMPLOYEE_CODE_EXISTS`: map to `employeeCode` field.
- `EMPLOYEE_EMAIL_EXISTS`: map to `email` field.
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
  resolver: zodResolver(employeeCreateSchema),
  mode: "onBlur",
  reValidateMode: "onChange",
  defaultValues
})
```

Zod schema:
- Schema name: `employeeCreateSchema`.
- Validates required fields before submit.
- Validates email format before submit.
- Validates trim/non-empty rules where applicable.
- Does not perform uniqueness checks; uniqueness remains API/DTO/custom validation responsibility.

## Local Form State
Initial values:

```text
employeeCode: ''
firstName: ''
lastName: ''
email: ''
phone: ''
position: ''
status: 'ACTIVE'
```

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
- `pendingSubmitPayload`
- `submitConfirmError`

Client validation:
- Required fields validate through Zod before submit.
- Email format validates through Zod before submit.
- `mode: "onBlur"` means field validation runs when the field loses focus.
- `reValidateMode: "onChange"` means an invalid field can be revalidated while user edits it.
- Uniqueness checks remain API/DTO/custom validation responsibility.

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `register(field)` | React Hook Form registers field value, blur, change, and validation behavior. |
| `handleBlur(field)` | Use React Hook Form registered `onBlur` behavior to mark field touched and trigger Zod field validation. Do not manually duplicate validation logic outside Zod. |
| `handleSubmit(onValid, onInvalid)` | React Hook Form validates with Zod, calls `onValid` when valid, and `onInvalid` when validation fails. |
| `onValid(values)` | Build normalized payload, store it as `pendingSubmitPayload`, clear `submitConfirmError`, and open submit confirm popup. Do not call mutation here. |
| `handleCloseSubmitConfirm()` | Close popup and clear popup error when mutation is not pending; keep form values unchanged. |
| `handleConfirmSubmit()` | Call `useCreateEmployeeMutation()` with `pendingSubmitPayload`; prevent duplicate calls while mutation is pending. |
| `handleCancel()` | Navigate to `/employees` if clean; show confirm leave dialog if dirty. |
| `handleBack()` | Same behavior as cancel/back navigation. |
| `mapApiErrorToForm(error)` | Convert API error codes to React Hook Form `setError` calls or root/form-level error. |
| `buildCreateEmployeePayload(values)` | Trim and normalize values before mutation. |

## Submit Confirm Popup Behavior
The submit confirm popup is required for this page.

Open flow:
```text
User clicks Save
    ↓
React Hook Form handleSubmit validates with Zod
    ↓
onValid builds normalized payload
    ↓
Store pendingSubmitPayload
    ↓
Open submit confirm popup
```

Confirm flow:
```text
User clicks Confirm submit
    ↓
Guard pendingSubmitPayload exists
    ↓
Call createEmployeeMutation.mutateAsync(pendingSubmitPayload)
    ↓
On success, invalidate ['employees'], show toast, close popup, clear pending payload
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
- The popup receives review values from `pendingSubmitPayload` or a safe display view model derived from it.
- Do not re-read mutable form state inside `handleConfirmSubmit`; submit the captured pending payload the user reviewed.
- Disable popup close, Cancel, and Confirm submit while `createEmployeeMutation.isPending` is true.
- Use `createEmployeeMutation.isPending` for the Confirm submit loading state.
- On non-field mutation error, keep the popup open and render `submitConfirmError`.
- On field-level mutation error, close the popup, clear pending payload, map errors with `setError`, and focus the first invalid field.

## Error Message Rendering
Field-level errors:
- Render each field error directly under its input.
- Use message from Zod or API error mapping.

Form-level error:
- Render root/form-level error message below the submit button.
- Examples: `FORBIDDEN`, unexpected API error, department blocked state, or unknown server error.
- Do not render raw backend error object.

Submit button area:

```text
[Save button]
[Cancel button]
<Form-level error message below buttons when exists>
```

Submit confirm popup area:

```text
<Review summary>
[Cancel button]
[Confirm submit button]
<Submit confirm error message when exists>
```

## Success Toast
Use `react-toastify` after insert succeeds.

Toast behavior:
- Position: `top-right`.
- Type: success.
- Message: `Employee created successfully.` unless API response message is approved and safe to display.
- Trigger only after create mutation succeeds.
- Do not show success toast before API success.

Proposed call:

```text
toast.success("Employee created successfully.", {
  position: "top-right"
})
```

## Render Flow
```text
Route guard passes
    ↓
EmployeeCreatePage mounted inside AppLayout WrapContent
    ↓
Read auth context
    ↓
Initialize local form state
    ↓
User inputs form values
    ↓
React Hook Form triggers Zod validation on blur and revalidation on change
    ↓
React Hook Form handleSubmit validates with Zod
    ↓
Valid submit opens submit confirm popup with pending payload review
    ↓
User confirms submit
    ↓
Create mutation calls EmployeeApiService.create(pendingSubmitPayload)
    ↓
Success invalidates employee list query
    ↓
Navigate or stay based on pending success decision
```

## Cleanup
- Local form state clears by unmount.
- Submit confirm popup state and pending submit payload clear by unmount.
- Do not clear `['employees']` cache.
- Do not clear auth global state.

## Pending Decisions
None blocking. Success navigates to `/employees/:id` (the created employee's detail page). Toast duration/styling is an implementation default.

