---
id: UI-AUTH-CHANGE-PASSWORD
type: ui
module: auth
status: draft
---

# Change Password

## Purpose
Allow an authenticated user to change their own password from a centered account form that visually matches Forgot Password.

## Route
- Path: `/change-password`
- Document title: `Change Password - EmployeeOS`
- Layout: `CenteredAccountLayout`
- Navbar title: none
- Navbar back button: hidden
- Back target: `/employees`
- Sidebar active item: none

## Permissions
- Requires authenticated user.
- No employee permission is required unless auth spec later defines one.

## Page Structure
```text
Change Password Page
└── Centered Account Form
    ├── Brand mark
    ├── App name: EmployeeOS
    ├── Brand subtitle: Account recovery
    ├── Form panel
    │   ├── Title: Change Password
    │   ├── Helper text
    │   ├── Current password field
    │   ├── New password field
    │   ├── Confirm new password field
    │   ├── Change Password button
    │   └── Back to employees link
```

## Visual Design
- Change Password uses the same centered form treatment as Forgot Password.
- Do not render navbar, sidebar, or breadcrumb on this page preview.
- Page background uses a calm full-screen neutral/green treatment, for example a soft green radial highlight over a light neutral gradient.
- Content is vertically and horizontally centered in the viewport.
- Form width is constrained to a readable account form size, around `max-w-md`.
- Brand block appears above the form with the green `E` mark, `EmployeeOS`, and `Account recovery` subtitle.
- Form panel uses a white elevated card with soft border, rounded corners, subtle shadow, and backdrop blur.
- Primary action is full width, green, and visually consistent with Forgot Password.
- Secondary navigation is a centered text link below the primary action.

## Field Behavior
| Field | UI Control | Behavior |
| --- | --- | --- |
| `currentPassword` | password input | Required, hide by default, support show/hide toggle. |
| `newPassword` | password input | Required, must satisfy approved password policy. |
| `confirmNewPassword` | password input | Required, must match new password. |

## Form Actions
- Back to employees: navigate to the employee area, fallback `/employees`.
- Back to employees preview link target: `employee-detail.html`.
- Change Password: submit only when client validation passes.
- Change Password button shows loading while mutation is pending.
- Prevent duplicate submit while request is in progress.

## Error State
- Field-level errors appear below fields.
- Form-level error appears near actions.
- Incorrect current password uses safe error message.
- Do not expose raw backend error object.

## Success State
- Show success toast: `Password changed successfully.`
- Proposed behavior: stay on page or navigate back; final target pending approval.
- If backend invalidates session after password change, follow approved auth/logout flow.

## Accessibility
- Password visibility toggles must be keyboard reachable.
- Confirm password mismatch must be associated with the confirm field.

## Pending Decisions
- Exact password policy is not approved.
- Whether changing password invalidates current or other sessions is not approved.
- Success navigation target is not approved.
