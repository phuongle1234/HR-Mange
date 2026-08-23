---
id: UI-EMPLOYEE-EDIT
type: ui
module: employee
status: draft
---

# Employee Edit

## Purpose
Provide a form to update an existing employee using approved DTO fields and validation rules.

## Route
- Path: `/employees/:id/edit`
- Navbar title: `Edit Employee`
- Navbar back button: visible
- Back target: `/employees/:id`, fallback `/employees`
- Sidebar active item: `Employee > Employee List`

## Permissions
- Required permission: `employee.update`
- Detail read permission may also be required to load existing employee data.
- If missing permission, show forbidden state and do not render form actions.

## Wrap Content Structure
```text
Employee Edit Page
├── Initial Detail Loading
├── Form
│   ├── Basic Information section
│   └── Contact Information section
├── Form Actions
│   ├── Cancel button
│   └── Save Changes button
└── Submit Confirm Popup
    ├── Changed fields summary
    ├── Cancel button
    └── Confirm update button
```

## Form Sections
| Section | Fields |
| --- | --- |
| Basic Information | Employee code, first name, last name, status |
| Contact Information | Email, phone |

## Field Behavior
| Field | UI Control | Behavior |
| --- | --- | --- |
| `employeeCode` | text input | Optional update field, trim, uniqueness excluding current employee. |
| `firstName` | text input | Optional update field, trim, not empty when provided. |
| `lastName` | text input | Optional update field, trim, not empty when provided. |
| `email` | email input | Optional update field, uniqueness excluding current employee. |
| `phone` | text input | Optional, phone validation pending approval. |
| `departmentId` | select | Disabled or marked blocked until Department spec is approved. |
| `position` | text input | Optional. |
| `status` | select | Uses approved status enum only. |

## Form Actions
- Cancel: navigate back to `/employees/:id` or `/employees` fallback.
- Save Changes: run client validation first; when validation passes and at least one field changed, open submit confirm popup instead of calling the update API immediately.
- Save button shows loading state during mutation.
- Prevent duplicate submit while request is in progress.

## Submit Confirm Popup
- Trigger: user clicks Save Changes, the form passes client validation, and there is at least one changed field.
- Purpose: ask the user to confirm before updating the employee.
- The update mutation must run only after the user confirms in the popup.
- Popup title: `Confirm Update Employee`.
- Popup message: `Please review the changed fields before updating this employee.`
- Layout should feel polished and trustworthy:
  - Centered modal overlay with dimmed page background.
  - White modal panel with `rounded-2xl`, `max-w-xl`, `p-6`, and `shadow-soft`.
  - Header includes title only in the current preview.
  - Body shows a compact changed-fields summary.
  - Footer actions align right on desktop and stack full-width on small mobile screens.
- Changed-fields summary:
  - Current preview shows the changed Email field.
  - Show the field label and previous-to-new value in a compact summary row.
  - Mask or omit sensitive values if any field is later classified as sensitive.
- Popup actions:
  - Cancel: close popup and return to the editable form without clearing values.
  - Confirm update: submit the already validated changed-field payload.
- Confirm update button shows loading state while mutation is pending.
- Disable Cancel and Confirm update while mutation is pending to prevent duplicate submit.
- Close popup automatically after successful update.
- Keep popup open and show form-level error if update fails with a non-field error.
- If API returns field-level validation errors, close popup and focus the first invalid field.
- Accessibility:
  - Use dialog semantics.
  - Trap focus inside the popup while open.
  - Escape key closes the popup only when mutation is not pending.
  - Initial focus should move to the Cancel button or the modal title when opened.
  - Return focus to the Save Changes button when the popup closes.

## Loading State
- Show skeleton while employee detail is loading.
- Disable form until existing employee data is loaded.

## Empty / Not Found State
- If employee does not exist, show not found state.
- Provide action back to employee list.

## Error State
- Field-level errors appear near fields.
- Form-level error appears above actions for non-field API errors.
- Confirm popup form-level error appears inside the popup footer/body when submit fails after confirmation.
- Detail load error shows retry action.
- Do not expose stack trace or raw backend error object.

## Success State
- Show success message after update succeeds.
- Navigate to employee detail or remain on edit page; target pending approval.

## Validation State
- Route param `id` must be valid before loading detail.
- Client validation must mirror API spec where possible.
- DTO/custom validation remains source for business validation such as uniqueness and employee existence.
- Department validation is blocked until Department spec is approved.

## Navigation
- Back: `/employees/:id`, fallback `/employees`.
- Cancel: `/employees/:id`, fallback `/employees`.
- After success: pending decision, proposed `/employees/:id`.

## Pending Decisions
- Exact field max lengths are not approved.
- Status enum is not approved.
- Success redirect target is not approved.
