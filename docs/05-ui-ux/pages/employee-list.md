---
id: UI-EMPLOYEE-LIST
type: ui
module: employee
status: draft
---

# Employee List

## Purpose
Display employees in a searchable, filterable, paginated list. This is the top-level Employee module page.

## Route
- Path: `/employees`
- Navbar title: `Employees`
- Navbar back button: hidden
- Sidebar active item: `Employee > Employee List`

## Permissions
- Required permission: `employee.read`
- Show create action only when user has `employee.create`.
- Show edit action only when user has `employee.update`.
- Show delete action only when user has `employee.delete`.

## Wrap Content Structure
```text
Employee List Page
├── Breadcrumb
├── Helper text
├── Toolbar
│   ├── Search input
│   ├── Department filter
│   ├── Status filter
│   └── Create Employee button
├── Data table
│   ├── Employee Code
│   ├── Full Name
│   ├── Email
│   ├── Phone
│   ├── Department
│   ├── Position
│   ├── Status
│   └── Actions
├── Pagination
└── Delete Confirm Popup
```

## Toolbar
| Component | Behavior |
| --- | --- |
| Search input | Searches by approved searchable fields. Trigger behavior pending frontend lifecycle spec. |
| Department filter | Disabled or hidden until Department spec is approved. |
| Status filter | Uses approved employee status enum only. |
| Create button | Navigates to `/employees/create`. Hidden if missing `employee.create`. |

Toolbar rules:
- `Create Employee` appears in the toolbar action area only.
- Do not duplicate `Create Employee` as a separate page-header action above the toolbar.
- Do not duplicate the navbar title `Employees` as a page-level H1 in the Employee List body.
- Breadcrumb appears above the toolbar and may show `Employee / Employee List`.
- Helper text appears below the breadcrumb: `Search, filter, and manage employee records with permission-aware actions.`

## Table
- Row click may navigate to employee detail, pending confirmation.
- Detail action navigates to `/employees/:id`.
- Edit action navigates to `/employees/:id/edit`.
- Delete action opens delete confirm popup before calling delete API.
- Do not show raw internal IDs as primary display values.

Table layout rules:
- The table wrapper must support scrolling for wide columns and many records.
- The table wrapper uses the current preview fixed height rule: `h-[calc(100vh-380px)]`.
- The table wrapper uses `overflow-auto` so horizontal overflow and long record lists scroll inside the table area.
- Keep pagination outside and below the scrollable table wrapper, inside the same white list card.
- Purpose of the fixed height is to keep the data area visually stable and make additional records scroll vertically without pushing pagination out of place.

## Delete Confirm Popup
- Trigger: user clicks a row Delete action.
- Purpose: ask the user to confirm before deleting the selected employee.
- The delete mutation must run only after the user confirms in the popup.
- Popup title: `Confirm Delete Employee`.
- Popup message: `This action may remove the employee from the system.`
- Layout should feel polished and careful:
  - Centered modal overlay with dimmed page background.
  - White modal panel with `rounded-2xl`, `max-w-xl`, `p-6`, and `shadow-soft`.
  - Header includes title only in the current preview.
  - Body shows a compact selected employee summary.
  - Footer actions align right on desktop and stack full-width on small mobile screens.
- Employee summary fields:
  - Employee code
  - Full name
- Popup actions:
  - Cancel: close popup and clear selected employee without deleting.
  - Confirm delete: call the delete mutation for the selected employee.
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
  - Return focus to the row Delete action when the popup closes.

## Loading State
- Show table skeleton rows.
- Keep toolbar visible but disable filters/actions that would trigger duplicate request if needed.

## Empty State
- Message: no employees found.
- If no filters are active and user has `employee.create`, show `Create Employee` action.
- If filters are active, show clear filters action.

## Error State
- Show concise error message.
- Show retry action for list query.
- Delete confirm popup shows a concise error message below actions when delete fails.
- Do not expose stack trace or raw backend error object.

## Success State
- List data displayed in table.
- Pagination metadata displayed when available.
- After successful delete, refresh list and show success message.

## Validation State
- Query validation happens before API request where possible.
- Invalid page, limit, or filter values must not call API.

## Navigation
- Create: `/employees/create`.
- Detail: `/employees/:id`.
- Edit: `/employees/:id/edit`.
- Back button: hidden on this top-level page.

## Pending Decisions
- Search debounce timing is not approved.
- Pagination default page size is not approved.
- Employee status display labels are not approved.
- Department filter is blocked until Department spec is approved.
