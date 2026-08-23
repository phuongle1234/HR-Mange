# WORK-013 — Frontend Pages: Forgot Password & Change Password — Test Report

## Scope Covered
`ForgotPasswordPage` (`/forgot-password`, public) and `ChangePasswordPage`
(`/change-password`, authenticated, `AppLayout`), their Zod schemas, and
`mapChangePasswordError`.

## Environment
Node v24.15.0 / npm 10.8.1. No live backend — `authApiService.forgotPassword`
and `authApiService.changePassword` are mocked in every component test.

## Commands Run And Real Results
```text
npx vitest run    # 18 files, 94 tests, ALL PASSED
npx tsc -b        # 0 errors
npm run build     # succeeded
```

## Tests (this item's slice)
`src/features/auth/schemas/auth.schemas.test.ts` (forgotPasswordSchema +
changePasswordSchema parts) — 7 tests: valid/invalid email; valid change-password
payload; mismatched confirmation rejected; new password rejected when shorter
than 8 chars / missing a number / missing a letter (`WORK-000` decision #6).

`src/features/auth/utils/map-auth-error.test.ts` (mapChangePasswordError part) —
4 tests: `CURRENT_PASSWORD_INVALID` -> `currentPassword` field;
`PASSWORD_POLICY_FAILED` -> `newPassword` field; `VALIDATION_ERROR` field errors
applied; unmapped code -> safe form-level message, no field touched.

`src/features/auth/pages/ForgotPasswordPage.test.tsx` — 3 component tests:
1. Success shows the exact safe accepted message.
2. An unrelated server failure (`INTERNAL_ERROR`) shows **the same** safe
   accepted message — proving the page never reveals whether the email exists
   based on request outcome.
3. `VALIDATION_ERROR` shows a field-level error instead of the accepted message.

`src/features/auth/pages/ChangePasswordPage.test.tsx` — 3 component tests:
1. Successful change shows a `react-toastify` success toast
   (`"Password changed successfully."`, `top-right`) and resets the form.
2. `CURRENT_PASSWORD_INVALID` renders under the "Current password" field.
3. A client-side mismatch between new/confirm password is caught before any API
   call (`changePassword` never invoked).

All 17 tests above passed. Full run: **94/94 passed**.

## Deviations / Assumptions
- Whether `change-password` invalidates the current session server-side is
  explicitly left open by `API-AUTH-CHANGE-PASSWORD` ("stateless JWT; no session
  store to invalidate"). The page does not assume invalidation: it shows the
  success toast and resets fields, without forcing logout/redirect. If the
  backend ever starts invalidating the token on password change, the next
  authenticated request's `401` will route through the existing Axios
  interceptor -> `clearAuth()` -> `AuthGuard` redirect path with no page change
  needed.
- The preview HTML's "Back to employees" link on the change-password mockup
  points at `employee-detail.html`; this implementation instead follows the
  written spec (`FRONTEND-AUTH-CHANGE-PASSWORD`'s "fallback `/employees`") and
  navigates to `/employees`, since the written spec — not an incidental HTML
  anchor href in a static mockup — is treated as the authoritative navigation
  target.

## Not Tested
- No live backend call.
- No test asserts the exact `AppLayout` chrome around `ChangePasswordPage` (that
  is exercised by rendering the route through the router, not by this page-level
  suite, which renders the page directly).

## Work Status
`IMPLEMENTED`.

## Test Result
**PASS** — 17/17 tests for this item, part of the full 94/94 passing suite.
