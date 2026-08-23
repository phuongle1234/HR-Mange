---
id: FRONTEND-AUTHENTICATION
type: frontend
module: global
status: draft
depends_on:
  - API-AUTHENTICATION
  - FRONTEND-API-CLIENT
  - FRONTEND-STATE-MANAGEMENT
---

# Authentication

## Purpose
Define frontend authentication behavior for protected routes and authenticated application state. Authentication decides whether the user has a valid session and whether protected pages can render.

Authorization decisions are defined separately in `FRONTEND-AUTHORIZATION`.

## Proposed Files
```text
src/providers/AuthProvider.tsx
src/providers/useAuth.ts
src/store/auth/auth.slice.ts
src/store/auth/auth.selectors.ts
src/features/auth/services/auth.api.ts
src/features/auth/hooks/useLoginMutation.ts
src/features/auth/hooks/useForgotPasswordMutation.ts
src/features/auth/hooks/useChangePasswordMutation.ts
src/features/auth/pages/LoginPage.tsx
src/features/auth/pages/ForgotPasswordPage.tsx
src/features/auth/pages/ChangePasswordPage.tsx
src/shared/cookie/auth-cookie.service.ts
```

## Responsibilities
- Initialize auth state when the app starts.
- Read session/token information through an approved cookie/token service.
- Call `GET /api/auth/me` when allowed and required.
- Support login, logout, forgot password, and change password flows through approved API services.
- Store authenticated user and auth status in Redux.
- Expose safe auth data through `useAuth()`.
- Coordinate with route guards and Axios interceptor.

The auth layer must not:
- Expose raw token to page components.
- Store passwords, JWTs, refresh tokens, secrets, API keys, or credentials in Redux.
- Own permission business rules beyond passing user data to PermissionProvider if approved.

## Auth State
Redux state shape:

```text
auth
├── authStatus: checking | authenticated | unauthenticated
├── currentUser: User | null
├── isAuthInitialized: boolean
└── authError: string | null
```

Rules:
- Initial status is `checking`.
- Protected routes render loading state while auth is `checking`.
- Protected routes redirect or block when auth is `unauthenticated`.
- Protected routes render only when auth is `authenticated`.
- `currentUser` must be cleared when session becomes unauthenticated.

## Provider Position
```text
ReduxProvider
└── QueryProvider
    └── AuthProvider
        └── PermissionProvider
            └── RouterProvider
```

AuthProvider requires Redux and QueryProvider to be ready before it runs.

## Session Source
Possible session sources:
- HttpOnly cookie sent automatically by browser.
- Encrypted readable cookie inspected by frontend.
- Authorization bearer token stored by an approved token service.

Current status:
- Exact token/cookie approach is not approved.
- AuthProvider must be written so page components do not care which approach is approved.

## Startup Flow
If frontend can inspect a token/cookie:

```text
App mounted
    ↓
AuthProvider dispatches checking
    ↓
AuthCookieService checks session marker
    ↓
No session marker
    ↓
Dispatch unauthenticated and skip Get Me
```

If session marker exists:

```text
AuthProvider detects session marker
    ↓
Call AuthApiService.getMe()
    ↓
Get Me succeeds
    ↓
Dispatch authenticated with currentUser
    ↓
PermissionProvider can initialize permission state
```

If frontend cannot inspect HttpOnly cookie:

```text
AuthProvider dispatches checking
    ↓
Call AuthApiService.getMe()
    ↓
Success means authenticated
    ↓
401 means unauthenticated
```

## Get Me API
Dependency:

```text
GET /api/auth/me
```

Rules:
- `AuthApiService.getMe()` owns the API call.
- AuthProvider calls the service; pages must not call Get Me manually.
- Response shape is pending approval.
- If permissions are returned in Get Me, PermissionProvider may consume them if approved.

## Auth API Service
```text
AuthApiService
├── login(payload)
├── getMe()
├── logout()
├── changePassword(payload)
└── forgotPassword(payload)
```

Rules:
- Page components call mutation hooks, not Axios directly.
- `login` stores session only through approved auth flow.
- `forgotPassword` must show the same safe success behavior whether email exists or not.
- `changePassword` must not log or persist password field values.

## useAuth API
Proposed return shape:

```text
useAuth()
├── authStatus
├── currentUser
├── isAuthInitialized
├── authError
├── login
├── logout
└── refreshSession
```

Rules:
- `useAuth()` must not return raw tokens.
- `login`, `logout`, `forgotPassword`, `changePassword`, and `refreshSession` are wrappers or hooks around approved auth flows.

## Route Guard Behavior
`AuthGuard` reads auth state:

| Auth status | Behavior |
| --- | --- |
| `checking` | Show route loading state. |
| `authenticated` | Render protected route. |
| `unauthenticated` | Redirect to `/login` or show unauthenticated state according to route spec. |

Rules:
- Protected page content must not flash before auth is known.
- Redirect target and return URL behavior are pending approval.
- AuthGuard does not check permissions; PermissionGuard owns permission checks.

## Logout Flow
```text
User selects Logout
    ↓
Call logout API if approved
    ↓
Clear frontend-readable session data if allowed
    ↓
Dispatch unauthenticated and clear currentUser
    ↓
Clear permission state
    ↓
Navigate to /login
```

Rules:
- Logout must not log token/cookie values.
- If HttpOnly cookies are used, backend logout endpoint must clear server/browser cookie.
- Exact logout API is pending approval.

## Login Flow
```text
User submits Login form
    ↓
Login mutation calls AuthApiService.login(payload)
    ↓
API authenticates session
    ↓
Dispatch authenticated user into Redux
    ↓
PermissionProvider initializes permissions
    ↓
Navigate to /employees or approved return URL
```

Rules:
- Login page must not store password outside React Hook Form submit lifecycle.
- Invalid credentials show a safe generic message.
- Do not reveal whether email exists.

## Forgot Password Flow
```text
User submits email
    ↓
Forgot password mutation calls AuthApiService.forgotPassword(payload)
    ↓
Show safe accepted message
    ↓
Do not reveal whether email exists
```

## Change Password Flow
```text
Authenticated user submits password form
    ↓
Change password mutation calls AuthApiService.changePassword(payload)
    ↓
Show success toast
    ↓
Reset password fields
    ↓
Follow session invalidation behavior if approved
```

Rules:
- Change Password requires authenticated route guard.
- Password values must not be stored in Redux, URL params, logs, or query cache.

## Refresh Session Flow
Refresh behavior is pending approval.

If approved later:
- Axios interceptor may attempt one refresh on `401`.
- Concurrent refresh calls should be deduplicated.
- Failed refresh clears auth and redirects protected routes.
- Infinite retry loops are forbidden.

## Error Handling
- `401` from Get Me marks session unauthenticated.
- Network error during startup sets `authError`; retry behavior is pending approval.
- Unexpected response shape sets safe auth error and unauthenticated state.
- Do not expose raw backend error object.

## Security
- Do not store or render passwords, JWTs, refresh tokens, secrets, API keys, credentials, or unnecessary sensitive data.
- Do not expose raw token through props, hooks, Redux, logs, or React DevTools state.
- Prefer HttpOnly cookie behavior if approved by security/auth spec.

## Test Notes
- Test AuthProvider startup success and unauthenticated paths.
- Test `AuthGuard` for checking/authenticated/unauthenticated states.
- Test logout clears auth and permission state when implemented.
- Mock API calls; do not use real credentials in tests.

## Pending Decisions
- Token/cookie storage strategy.
- Cookie name and encryption/decryption behavior.
- Exact Get Me response shape.
- Login, logout, change password, forgot password, and refresh endpoint final response shapes.
- Redirect URL and return URL behavior.
