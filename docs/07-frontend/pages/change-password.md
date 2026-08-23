---
id: FRONTEND-AUTH-CHANGE-PASSWORD
type: frontend
module: auth
status: draft
depends_on:
  - UI-AUTH-CHANGE-PASSWORD
  - API-AUTH-CHANGE-PASSWORD
  - FRONTEND-REACT-ROUTE
  - FRONTEND-AUTHENTICATION
  - FRONTEND-API-CLIENT
---

# Change Password

## Purpose
Define React behavior for authenticated users changing their own password.

## Route Reference
```text
/change-password -> ChangePasswordPage
```

## Proposed File
```text
src/features/auth/pages/ChangePasswordPage.tsx
```

## Responsibilities
- Render form from `UI-AUTH-CHANGE-PASSWORD`.
- **Not gated by `AuthGuard`** (see `docs/07-frontend/react-route.md`'s Change Password Route) — the route renders inside `AuthLayout`, the same public shell as `/login`. This diverges from the route's original design (previously `AuthGuard`-protected, rendered in `AppLayout`); the page itself still calls `useAuth()`/the change-password mutation the same way, which will simply fail its own way (e.g. `UNAUTHORIZED`) if no session exists.
- Validate current password, new password, and confirm password with React Hook Form and Zod.
- Call change password mutation.
- Show success toast after mutation succeeds.
- Follow approved auth/session behavior if backend invalidates session.

## State Ownership
| State | Owner |
| --- | --- |
| Form values/errors | React Hook Form |
| Mutation status | TanStack Mutation |
| Auth/session state | Redux through AuthProvider |
| Success toast | `react-toastify` |

## Hooks
| Hook | Purpose |
| --- | --- |
| `useAuth()` | Ensure authenticated context is available. |
| `useForm()` | Own password form state. |
| `zodResolver(changePasswordSchema)` | Validate required fields and confirm match. |
| `useChangePasswordMutation()` | Submit `POST /api/auth/change-password`. |
| `useNavigate()` | Cancel/back navigation. |

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `handleSubmit(onValid, onInvalid)` | Validate before mutation. |
| `onValid(values)` | Build payload and call mutation. |
| `handleCancel()` | Navigate back to previous authenticated page, fallback `/employees`. |
| `mapChangePasswordError(error)` | Map current password/policy/validation errors safely. |

## Error Handling
- `CURRENT_PASSWORD_INVALID`: map to `currentPassword` or safe form-level error.
- `PASSWORD_POLICY_FAILED`: map to `newPassword`.
- `VALIDATION_ERROR`: map returned field errors.
- `UNAUTHORIZED`: let auth flow handle session expiration.
- Do not render raw backend error object.

## Success Flow
```text
Change password mutation succeeds
    ↓
Show success toast
    ↓
Reset password fields
    ↓
Stay on page or navigate according to pending decision
```

## Pending Decisions
- Exact password policy.
- Whether session is invalidated after password change.
- Success navigation target.
