---
id: UI-AUTH-FORGOT-PASSWORD
type: ui
module: auth
status: draft
---

# Forgot Password

## Purpose
Allow a user to request password reset instructions without exposing whether an email exists in the system.

## Route
- Path: `/forgot-password`
- Layout: `AuthLayout`
- Navbar: hidden
- Sidebar: hidden

## Layout
```text
Forgot Password Page
└── Centered Forgot Password Form
    ├── Brand / App name
    ├── Email field
    ├── Send Instructions button
    ├── Back to Login link
    └── Success / Error message
```

## Visual Design
- Use `Green Momentum` theme.
- Form panel is centered horizontally and vertically.
- Primary action uses green.
- Keep text concise and security-safe.
- Background uses the current centered account preview treatment: soft green radial highlight plus light neutral vertical gradient.
- Brand block appears above the form with green `E` mark, `EmployeeOS`, and `Account recovery` subtitle.
- Form panel uses `rounded-2xl`, white translucent surface, soft border, `p-8`, `shadow-soft`, and backdrop blur.
- Input is `h-11`, `rounded-lg`, with green focus ring.

## Field Behavior
| Field | UI Control | Behavior |
| --- | --- | --- |
| `email` | email input | Required, valid email format, trim/lowercase before submit if approved. |

## Actions
- Send Instructions: submit only when client validation passes.
- Back to Login: navigate to `/login`.
- Back to Login preview link target: `login.html`.
- Disable submit while request is pending.
- Prevent duplicate submit.

## Success State
- Show safe message: `If the email is registered, password reset instructions will be sent.`
- Do not reveal whether the email exists.

## Error State
- Field-level email validation appears below field.
- Network or unexpected error appears as safe form-level message.
- Do not expose raw backend error object.

## Accessibility
- Initial focus should move to email input.
- Success and error messages should be announced to assistive technology.

## Pending Decisions
- Exact reset delivery channel is not approved.
- Exact reset token behavior is not approved.
- Whether a reset password page is in scope is not approved.
