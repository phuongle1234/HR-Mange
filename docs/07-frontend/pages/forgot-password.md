---
id: FRONTEND-AUTH-FORGOT-PASSWORD
type: frontend
module: auth
status: draft
depends_on:
  - UI-AUTH-FORGOT-PASSWORD
  - API-AUTH-FORGOT-PASSWORD
  - FRONTEND-REACT-ROUTE
  - FRONTEND-API-CLIENT
---

# Forgot Password

## Purpose
Define React behavior for requesting password reset instructions.

## Route Reference
```text
/forgot-password -> ForgotPasswordPage
```

## Proposed File
```text
src/features/auth/pages/ForgotPasswordPage.tsx
```

## Responsibilities
- Render centered forgot password form from `UI-AUTH-FORGOT-PASSWORD`.
- Validate email with React Hook Form and Zod.
- Call forgot password mutation.
- Show safe success message that does not reveal whether email exists.
- Navigate back to login when requested.

## State Ownership
| State | Owner |
| --- | --- |
| Email value/error | React Hook Form |
| Mutation status | TanStack Mutation |
| Success message | Local state or mutation success state |
| Form-level error | Local state or React Hook Form root error |

## Hooks
| Hook | Purpose |
| --- | --- |
| `useForm()` | Own email field state. |
| `zodResolver(forgotPasswordSchema)` | Validate email format. |
| `useForgotPasswordMutation()` | Submit `POST /api/auth/forgot-password`. |
| `useNavigate()` | Navigate to `/login`. |

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `handleSubmit(onValid, onInvalid)` | Validate before request. |
| `onValid(values)` | Normalize email and call mutation. |
| `handleBackToLogin()` | Navigate to `/login`. |

## Success Flow
```text
Request succeeds
    ↓
Show safe accepted message
    ↓
Keep user on forgot password page with Back to Login action
```

## Error Handling
- `VALIDATION_ERROR`: map email field error.
- `TOO_MANY_REQUESTS`: show safe rate-limit message.
- Network/unexpected errors show safe form-level message.
- Do not reveal whether email exists.

## Pending Decisions
- Reset password page and token route are not approved.
- Exact reset delivery channel is not approved.
