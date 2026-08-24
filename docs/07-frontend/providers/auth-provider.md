---
id: FRONTEND-AUTH-PROVIDER
type: frontend
module: auth
status: draft
depends_on:
  - API-AUTHENTICATION
  - FRONTEND-API-CLIENT
  - FRONTEND-STATE-MANAGEMENT
---

# AuthProvider

## Purpose
Define the frontend authentication provider used by protected routes and pages. `AuthProvider` holds the Bearer access token (per `WORK-000` decision #4 — no auth cookie), calls the Get Me API to validate it on startup, and stores authenticated user state in Redux global state.

## Proposed Files
```text
src/providers/AuthProvider.tsx
src/providers/useAuth.ts
src/store/auth/auth.slice.ts
src/features/auth/services/auth.api.ts
src/shared/auth/token-storage.ts
```

## Provider Position
No `PermissionProvider` exists (`WORK-000` decision #2).
```text
ReduxProvider
└── QueryProvider
    └── AuthProvider
        └── RouterProvider
```

## Token Storage
- The access token returned by `POST /api/auth/login` is held in memory (Redux `authSlice`) and persisted to `localStorage` under a single key (e.g. `employeeos.accessToken`) so a page refresh does not immediately log the user out.
- `token-storage.ts` is the only module that reads/writes `localStorage` for the token — pages and other components never touch it directly.
- The Axios request interceptor (see `FRONTEND-API-CLIENT`) reads the token from Redux state (not `localStorage` directly) and attaches `Authorization: Bearer <token>`.
- There is no refresh token and no silent-refresh flow in this phase; a `401` response clears the token and redirects to `/login`.

## Redux Auth State
```text
authSlice
```
State shape:
```text
accessToken: string | null
authStatus: checking | authenticated | unauthenticated
currentUser: { id, email, fullName } | null
authError: string | null
```
Actions:
```text
setAuthChecking()
setAuthenticated({ accessToken, currentUser })
setUnauthenticated()
setAuthError(error)
clearAuth()
```

## Responsibilities
- On app start, read the token from `localStorage` via `token-storage.ts`.
- If no token exists, dispatch `setUnauthenticated()` immediately (no API call).
- If a token exists, dispatch `setAuthChecking(token)`, call `GET /api/auth/me` with that token attached, and:
  - On success: dispatch `setAuthenticated({ accessToken: token, currentUser: user })`.
  - On `401`/failure: clear the stored token and dispatch `setUnauthenticated()`.
- Expose auth state through Redux and `useAuth()`; route guards consume the Redux-backed auth state rather than raw token values.
- On login success (`useLoginMutation`), store the returned `accessToken` in Redux + `localStorage` and dispatch `setAuthenticated(...)` directly — no extra `GET /api/auth/me` call is needed right after login since the login response already includes the user.

## Startup Flow
```text
App mounted
    ↓
ReduxProvider initializes store
    ↓
AuthProvider mounted
    ↓
Dispatch setAuthChecking()
    ↓
Read token from localStorage
    ↓
No token: dispatch setUnauthenticated()
Token found: call GET /api/auth/me with Authorization header
    ↓
Get Me succeeds: dispatch setAuthenticated({ accessToken, currentUser })
Get Me fails (401): clear stored token, dispatch setUnauthenticated()
```

## useAuth Public API
```text
useAuth()
├── authStatus
├── currentUser
├── login(payload)
├── logout()
```
- `login()` wraps the login mutation and, on success, stores the token and dispatches `setAuthenticated`.
- `logout()` calls the auth logout action (best-effort — there is no server-side session to invalidate), clears the token from storage, dispatches `setUnauthenticated()`, and navigates to `/login`.
- The application exposes the token only to the Axios interceptor via Redux state; page components do not read it directly.
- `useAuth()` is the public read wrapper for `authStatus` and `currentUser`, while `AuthProvider` itself owns the startup validation flow.

## Logout Flow
```text
User clicks logout
    ↓
Call POST /api/auth/logout (best-effort, ignore failure)
    ↓
Clear token from localStorage and Redux
    ↓
Dispatch clearAuth() / setUnauthenticated()
    ↓
Navigate to /login
```

## Error Handling
- Network error during Get Me: set `authError`, treat as unauthenticated (do not retry automatically).
- `401` during Get Me or any other request: clear the token and redirect protected routes to `/login`.
- Do not log the access token anywhere (console, error reporting, etc.).

## Route Guard Usage
`AuthGuard` reads Redux auth state through `useAuth()`:
- `checking`: show route loading state.
- `authenticated`: render protected route.
- `unauthenticated`: redirect to `/login`.

## Page Usage
Pages may read `currentUser` and `authStatus`. Pages must not read the token directly or call `GET /api/auth/me` manually.

## Ambiguities
None blocking. This is a full rewrite of the previous cookie-based design to match the Bearer-token decision in `WORK-000`.
