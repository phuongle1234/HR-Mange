---
id: UI-AUTH-LOGIN
type: ui
module: auth
status: draft
---

# Login

## Purpose
Provide a centered login form for users to authenticate before accessing protected employee management pages.

## Route
- Path: `/login`
- Layout: `AuthLayout`
- Navbar: hidden
- Sidebar: hidden

## Layout
```text
Login Page
└── Centered Login Form
    ├── Brand / App name
    ├── Email field
    ├── Password field
    ├── Login button
    ├── Forgot Password link
    └── Form-level error
```

## Visual Design
- Use `Green Momentum` theme.
- Form panel is centered horizontally and vertically.
- Primary Login button uses green.
- Keep form width constrained for readability.
- Background uses the current centered account preview treatment: soft green radial highlight plus light neutral vertical gradient.
- Brand block appears above the form with green `E` mark, `EmployeeOS`, and `Green Momentum` subtitle.
- Form panel uses `rounded-2xl`, white translucent surface, soft border, `p-8`, `shadow-soft`, and backdrop blur.
- Inputs are `h-11`, `rounded-lg`, with green focus ring.

## Field Behavior
| Field | UI Control | Behavior |
| --- | --- | --- |
| `email` | email input | Required, trim/lowercase before submit if approved by frontend auth spec. |
| `password` | password input | Required, hide by default, support show/hide toggle. |

## Actions
- Login: submit only when required client validation passes.
- Forgot Password: navigate to `/forgot-password`.
- Forgot Password preview link target: `forgot-password.html`.
- Disable Login while login mutation is pending.
- Prevent duplicate submit while request is in progress.

## Error State
- Field-level errors appear below fields.
- Form-level error appears above or below Login button.
- Invalid credentials must use a safe generic message.
- Do not reveal whether email or password specifically failed.
- Do not expose raw backend error object.

## Success State
- After login succeeds, navigate to protected default route, proposed `/employees`.
- If return URL behavior is approved, navigate to the requested protected route.

## Accessibility
- Initial focus should move to email input.
- Password visibility toggle must be keyboard reachable.
- Errors must be associated with fields.

## Pending Decisions
- Exact app/brand display name.
- Exact login success redirect behavior.
- Exact auth token/cookie handling.
