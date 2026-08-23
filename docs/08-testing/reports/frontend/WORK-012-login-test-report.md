# WORK-012 — Frontend Page: Login — Test Report

## Scope Covered
`LoginPage` (`src/features/auth/pages/LoginPage.tsx`) at `/login`, `AuthProvider`
(`src/providers/AuthProvider.tsx`), `useAuth()` (`src/providers/useAuth.ts`),
`useLoginMutation()` (`src/features/auth/hooks/useLoginMutation.ts`), the login
Zod schema, and the safe login-error mapping helper.

## Environment
Node v24.15.0 / npm 10.8.1. No live backend — `authApiService.login` is mocked in
every component test; this is a mocked-API test suite, not a live integration test.

## Commands Run And Real Results
```text
npx vitest run    # 18 files, 94 tests, ALL PASSED (this item's tests included)
npx tsc -b        # 0 errors
npm run build     # succeeded
```

## Tests (this item's slice)
`src/features/auth/schemas/auth.schemas.test.ts` (loginSchema part) — 3 tests:
valid email/password accepted; invalid email format rejected; empty password
rejected.

`src/features/auth/utils/map-auth-error.test.ts` (mapLoginError part) — 3 tests:
`INVALID_CREDENTIALS` -> generic "Incorrect email or password."; `USER_DISABLED`
-> safe account-unavailable message; unknown code -> generic fallback. Confirms
the message never differs based on which credential was wrong.

`src/features/auth/pages/LoginPage.test.tsx` — 3 component tests (mocked
`authApiService.login`, mocked `useNavigate`):
1. Submitting the empty form shows both field validation errors and never calls
   the API.
2. `INVALID_CREDENTIALS` shows the generic message and asserts the raw backend
   message string is **not** present anywhere in the DOM.
3. A successful login calls `authApiService.login` with the trimmed/typed
   payload and navigates to `/employees` with `{ replace: true }`.

All 9 tests above passed. Full run: **94/94 passed**.

## Deviations From The Original Spec Text (flagged, not silent)
- `useAuth()` does **not** expose a `login()` wrapper as `FRONTEND-AUTH-PROVIDER`'s
  prose describes. `LoginPage` calls `useLoginMutation()` directly (also listed in
  its own Hooks table), and that hook itself performs the "store token + dispatch
  `setAuthenticated`" side effect on success — matching
  `docs/07-frontend/providers/auth-provider.md`'s literal instruction that
  `useLoginMutation` do this. Adding a second wrapper in `useAuth()` would only
  create a second, unused `useMutation` instance. `useAuth()` instead exposes
  `authStatus`, `currentUser`, and `logout()`.
- Login page's password field uses a small custom show/hide toggle (not the
  shared `TextField`) to match the login preview's inline "Show" control; this is
  intentional, not an oversight.

## Not Tested
- No live backend call. No test of the `PublicOnlyGuard` redirect-away-from-login
  behavior at the route level (that guard has no dedicated unit test file; it is
  a thin `Navigate`/`Outlet` wrapper and is exercised implicitly by the route
  table wiring, not in isolation).

## Work Status
`IMPLEMENTED`.

## Test Result
**PASS** — 9/9 tests for this item, part of the full 94/94 passing suite.
