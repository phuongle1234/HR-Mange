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
- The access token returned by `POST /api/auth/login` is held in memory (Redux `authSlice`) and persisted to a **browser cookie** under a single key (`employeeos.accessToken`) so a page refresh does not immediately log the user out.
- **Cookie, not `localStorage`** (changed 2026-08-28): `localStorage` has no expiry, so a token persisted there outlives the JWT itself and survives until an explicit logout. A cookie expires on its own.
- The cookie's `Expires` is derived from the **JWT's own `exp` claim**, so cookie and token always expire together. `exp` is read by Base64url-decoding the payload segment **without signature verification** — used solely to pick a client-side expiry, never to trust the token's contents. The backend remains the sole authority on validity. If `exp` is missing, unusable, or already past, a short fallback lifetime is used instead. Do not hard-code a lifetime here: it would silently drift the day the backend's `JWT_ACCESS_EXPIRES_IN` changes.
- Cookie attributes: `Path=/`, `SameSite=Strict`, and `Secure` **only when the page is served over HTTPS** (an unconditional `Secure` would make the cookie unwritable during plain-HTTP local dev).
- The stored value is the raw JWT and is **not encrypted**. This is a deliberate decision, not an omission: any key the frontend could decrypt with must ship in the JS bundle, so client-side encryption would be obfuscation only and would not stop an XSS attacker from reading the token. See Pending Decisions for the real mitigation.
- The cookie is **not** `httpOnly` — it cannot be, because JavaScript writes it. It is therefore readable by scripts on the page, the same exposure `localStorage` had.
- `token-storage.ts` is the only module that reads/writes the token cookie — pages and other components never touch `document.cookie` directly.
- The Axios request interceptor (see `FRONTEND-API-CLIENT`) reads the token from Redux state (not the cookie directly) and attaches `Authorization: Bearer <token>`. The token is **not** sent automatically as a cookie to the API: `withCredentials` stays `false` and the backend still authenticates via the `Authorization` header only.
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
- On app start, read the token from the cookie via `token-storage.ts`. An expired cookie is simply absent, so a stale session resolves to unauthenticated with no extra check.
- If no token exists, dispatch `setUnauthenticated()` immediately (no API call).
- If a token exists, dispatch `setAuthChecking(token)`, call `GET /api/auth/me` with that token attached, and:
  - On success: dispatch `setAuthenticated({ accessToken: token, currentUser: user })`.
  - On `401`/failure: clear the stored token and dispatch `setUnauthenticated()`.
- Expose auth state through Redux and `useAuth()`; route guards consume the Redux-backed auth state rather than raw token values.
- On login success (`useLoginMutation`), store the returned `accessToken` in Redux + the expiring cookie and dispatch `setAuthenticated(...)` directly — no extra `GET /api/auth/me` call is needed right after login since the login response already includes the user.

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
Read token from cookie
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
Clear token cookie and Redux state
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

## Pending Decisions
- **`httpOnly` cookie set by the backend.** The only real mitigation against script access to the token. It would require the backend to issue `Set-Cookie` (`httpOnly`, `Secure`, `SameSite`) on login, `api-client.ts` to switch to `withCredentials: true`, a CORS credentials allowance, and this provider to stop persisting the token client-side entirely. That is a change to the auth contract (`API-AUTHENTICATION`) and to `WORK-000` decision #4 ("no auth cookie"), so it is recorded here rather than done implicitly. Until then, the token remains script-readable and XSS is the accepted residual risk.
- **Client-side encryption of the stored token was considered and rejected** — see Token Storage. Do not "fix" this by adding a crypto library: the key would ship in the bundle, giving obfuscation rather than security, plus a false sense of protection.

## Ambiguities
None blocking.

Note on history: `WORK-000` decision #4 chose Bearer-token auth over an auth cookie, and this file was rewritten at that time to remove a previous cookie-based design. The 2026-08-28 change above does **not** reverse that decision — the cookie here is only a client-side storage medium with an expiry, written and read by JavaScript. The API contract is unchanged: the backend still authenticates via the `Authorization: Bearer` header and no cookie is sent to it.
