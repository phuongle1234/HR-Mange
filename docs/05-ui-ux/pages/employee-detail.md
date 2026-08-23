---
id: UI-EMPLOYEE-DETAIL
type: ui
module: employee
status: draft
---

# Employee Detail

## Purpose
Display read-only employee information and provide contextual actions such as edit or delete based on permission.

## Route
- Path: `/employees/:id`
- Navbar title: `Employee Detail`
- Navbar back button: visible
- Back target: `/employees`
- Sidebar active item: `Employee > Employee List`

## Permissions
- Required permission: `employee.read`
- Show edit action only when user has `employee.update`.
- Show delete action only when user has `employee.delete`.

## Wrap Content Structure
```text
Employee Detail Page
├── Breadcrumb
├── Header Actions
│   ├── Edit button
│   └── Delete button
├── Employee Information section
│   ├── Employee code tile
│   ├── Full name tile
│   ├── Status tile
│   ├── Email tile
│   ├── Department tile
│   └── Position tile
└── Delete Confirm Popup
```

## Sections
| Section | Fields |
| --- | --- |
| Employee Information | Employee code, full name, status, email, department, position |

Section visual rules:
- Render one white `rounded-2xl` card titled `Employee Information`.
- Inside the card, render field tiles in a responsive grid, three columns on desktop where space allows.
- Each tile uses a light neutral background, border, uppercase small label, and bold value.
- Department value displays `Pending` in the current preview.

## Component Behavior
- Edit button navigates to `/employees/:id/edit`.
- Delete button opens delete confirm popup before calling delete API.
- If Department spec is not approved, Department display should show pending/unknown state rather than inventing data.

## Delete Confirm Popup
- Trigger: user clicks Delete.
- Purpose: ask the user to confirm before deleting the employee.
- The delete mutation must run only after the user confirms in the popup.
- Popup title: `Confirm Delete Employee`.
- Popup message: `This action may remove the employee from the system.`
- Layout should feel polished and careful:
  - Centered modal overlay with dimmed page background.
  - White modal panel with `rounded-2xl`, `max-w-xl`, `p-6`, and `shadow-soft`.
  - Header includes title only in the current preview.
  - Current preview does not render an employee summary in the detail delete popup.
  - Footer actions align right on desktop and stack full-width on small mobile screens.
- Employee summary fields:
  - Not rendered in the current preview.
- Popup actions:
  - Cancel: close popup without deleting.
  - Confirm delete: call the delete mutation.
- Confirm delete button uses destructive styling.
- Confirm delete button shows loading state while mutation is pending.
- Disable Cancel and Confirm delete while mutation is pending to prevent duplicate delete.
- Close popup automatically after successful delete.
- Keep popup open and show delete error if the API returns a non-field error.
- Do not expose stack trace or raw backend error object.
- Accessibility:
  - Use dialog semantics.
  - Trap focus inside the popup while open.
  - Escape key closes the popup only when mutation is not pending.
  - Initial focus should move to the Cancel button or the modal title when opened.
  - Return focus to the Delete button when the popup closes.

## Loading State
- Show detail skeleton sections.
- Disable edit/delete actions while loading.

## Empty / Not Found State
- If API returns `EMPLOYEE_NOT_FOUND`, show not found message.
- Provide action back to employee list.

## Error State
- Show concise error message and retry action.
- Delete confirm popup shows a concise error message below actions when delete fails.
- Do not expose stack trace or raw backend error object.

## Success State
- Display employee details grouped by section.
- Show actions according to permissions.

## Validation State
- Route param `id` must be valid before calling detail API.
- Invalid `id` shows validation/not found style state and does not call API.

## Navigation
- Back: `/employees`.
- Edit: `/employees/:id/edit`.
- After delete success: navigate to `/employees`.

## Pending Decisions
- Exact fields depend on approved Employee database spec.
- Delete behavior is pending soft/hard delete decision.
