---
id: UI-EMPLOYEE-CREATE
type: ui
module: employee
status: draft
---

# Employee Create

## Purpose
Provide a form to create a new employee using approved DTO fields and validation rules.

## Route
- Path: `/employees/create`
- Navbar title: `Create Employee`
- Navbar back button: visible
- Back target: `/employees`
- Sidebar active item: `Employee > Create Employee`

## Permissions
- Required permission: `employee.create`
- If missing permission, show forbidden state and do not render form actions.

## Wrap Content Structure
```text
Employee Create Page
├── Form
│   ├── Basic Information section
│   ├── Contact Information section
│   └── Organization Information section
├── Form Actions
│   ├── Cancel button
│   └── Save button
└── Submit Confirm Popup
    ├── Review summary
    ├── Cancel button
    └── Confirm submit button
```

## Form Sections
| Section | Fields |
| --- | --- |
| Basic Information | Employee code, first name, last name, status |
| Contact Information | Email, phone |
| Organization Information | Department, position |

## Field Behavior
| Field | UI Control | Behavior |
| --- | --- | --- |
| `employeeCode` | text input | Required, trim, show uniqueness validation error from DTO/API validation. |
| `firstName` | text input | Required, trim. |
| `lastName` | text input | Required, trim. |
| `email` | email input | Required, lowercase/trim behavior should match frontend spec, show duplicate error. |
| `phone` | text input | Optional, phone validation pending approval. |
| `departmentId` | select | Required by current API draft, but disabled or marked blocked until Department spec is approved. |
| `position` | text input | Optional. |
| `status` | select | Optional until status enum is approved. |

## Form Actions
- Cancel: navigate to `/employees`.
- Save: run client validation first; when validation passes, open submit confirm popup instead of calling the create API immediately.
- Save button shows loading state during mutation.
- Prevent duplicate submit while request is in progress.

## Submit Confirm Popup
- Trigger: user clicks Save and the form passes client validation.
- Purpose: ask the user to confirm before creating the employee.
- The create mutation must run only after the user confirms in the popup.
- Popup title: `Confirm Create Employee`.
- Popup message: `Please review the employee information before creating this employee.`
- Layout should feel polished and trustworthy:
  - Centered modal overlay with dimmed page background.
  - White modal panel with `rounded-2xl`, `max-w-xl`, `p-6`, and `shadow-soft`.
  - Header includes title only in the current preview.
  - Body shows a compact review summary using submitted form values.
  - Footer actions align right on desktop and stack full-width on small mobile screens.
- Review summary fields:
  - Full name
  - Email
- Popup actions:
  - Cancel: close popup and return to the editable form without clearing values.
  - Confirm submit: submit the already validated payload.
- Confirm submit button shows loading state while mutation is pending.
- Disable Cancel and Confirm submit while mutation is pending to prevent duplicate submit.
- Close popup automatically after successful create.
- Keep popup open and show form-level error if create fails with a non-field error.
- If API returns field-level validation errors, close popup and focus the first invalid field.
- Accessibility:
  - Use dialog semantics.
  - Trap focus inside the popup while open.
  - Escape key closes the popup only when mutation is not pending.
  - Initial focus should move to the Cancel button or the modal title when opened.
  - Return focus to the Save button when the popup closes.

## Loading State
- Initial loading may occur if dropdown data such as departments or status options is required.
- Disable form while required option data is loading.

## Empty State
- Not applicable for the form itself.
- If required select options are unavailable, show disabled state and explanation.

## Error State
- Field-level errors appear near fields.
- Form-level error appears above actions for non-field API errors.
- Confirm popup form-level error appears inside the popup footer/body when submit fails after confirmation.
- Do not expose stack trace or raw backend error object.

## Success State
- Show success message after create succeeds.
- Navigate to employee detail or employee list; target pending approval.

## Validation State
- Client validation must mirror API spec where possible.
- DTO/custom validation remains source for business validation such as uniqueness.
- Department validation is blocked until Department spec is approved.

## Navigation
- Back: `/employees`.
- Cancel: `/employees`.
- After success: pending decision, proposed `/employees/:id`.

## Pending Decisions
- Exact field max lengths are not approved.
- Status enum is not approved.
- Department data source is blocked.
- Success redirect target is not approved.
