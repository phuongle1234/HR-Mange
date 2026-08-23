---
id: FRONTEND-AUTH-LOGIN
type: frontend
module: auth
status: draft
depends_on:
  - UI-AUTH-LOGIN
  - API-AUTH-LOGIN
  - FRONTEND-REACT-ROUTE
  - FRONTEND-AUTHENTICATION
  - FRONTEND-API-CLIENT
---

# Login

## Purpose
Define React behavior for the public login page.

## Route Reference
```text
/login -> LoginPage
```

## Proposed File
```text
src/features/auth/pages/LoginPage.tsx
```

## Responsibilities
- Render centered login form from `UI-AUTH-LOGIN`.
- Manage form state with React Hook Form.
- Validate email/password before submit with Zod.
- Call login mutation through auth API service.
- Store authenticated user/session through AuthProvider/auth slice flow.
- Navigate to `/employees` or approved return URL after success.

## State Ownership
| State | Owner |
| --- | --- |
| Form values/errors | React Hook Form |
| Login mutation status | TanStack Mutation |
| Authenticated user | Redux through AuthProvider/auth actions |
| Form-level login error | React Hook Form root error or local state |

## Hooks
| Hook | Purpose |
| --- | --- |
| `useForm()` | Own email/password form state. |
| `zodResolver(loginSchema)` | Validate login payload. |
| `useLoginMutation()` | Submit `POST /api/auth/login`. |
| `useNavigate()` | Navigate after login success. |
| `useAuth()` | Read current auth state; `PublicOnlyGuard` redirects already-authenticated users away from this page. |

## Handler Functions
| Function | Responsibility |
| --- | --- |
| `handleSubmit(onValid, onInvalid)` | Validate before login. |
| `onValid(values)` | Normalize payload and call login mutation. |
| `mapLoginError(error)` | Show generic safe credential/session error. |
| `handleForgotPassword()` | Navigate to `/forgot-password`. |

## Error Handling
- `INVALID_CREDENTIALS`: show generic form-level error.
- `VALIDATION_ERROR`: map field errors when returned.
- `TOO_MANY_REQUESTS`: show safe rate-limit message.
- Do not reveal whether email exists.
- Do not render raw backend error object.

## Success Flow
```text
Login mutation succeeds
    ↓
Auth state is set authenticated
    ↓
Navigate to /employees
```

## Pending Decisions
None blocking — token transport is resolved (Bearer token, per `WORK-000` decision #4; see `FRONTEND-AUTH-PROVIDER`). Return URL behavior after login stays fixed at `/employees` for this phase.
