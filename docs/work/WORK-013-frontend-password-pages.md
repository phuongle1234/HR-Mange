---
id: WORK-013
type: workflow
module: auth
status: draft
depends_on:
  - 07-FRONTEND-PAGES-FORGOT-PASSWORD
  - 07-FRONTEND-PAGES-CHANGE-PASSWORD
  - API-AUTH-FORGOT-PASSWORD
  - API-AUTH-CHANGE-PASSWORD
---

# WORK-013: Frontend Page — Forgot Password & Change Password

## Work Status
`IMPLEMENTED` — `ForgotPasswordPage` and `ChangePasswordPage` are built against the documented `POST /api/auth/forgot-password` / `POST /api/auth/change-password` contracts, sharing `AuthLayout`'s visual pattern with `WORK-012`. Built without waiting on `WORK-006` (backend) being live, per this task's instruction to build against the documented contract; no live end-to-end run against a real backend has been performed yet.

## Summary
Implement the two simple auth utility pages: `ForgotPasswordPage` (public, `/forgot-password`) and `ChangePasswordPage` (authenticated, `/change-password`), per their respective `07-frontend/pages/*.md` specs.

## Scope
In scope:
- `src/features/auth/pages/ForgotPasswordPage.tsx`: single email field, always shows the same safe "if registered..." message regardless of API result.
- `src/features/auth/pages/ChangePasswordPage.tsx`: current/new/confirm password fields, success toast, uses the same centered layout as Forgot Password.
- Route wiring for both in `app.routes.tsx`.

Out of scope:
- Login page (`WORK-012`).
- Employee pages.

## Dependencies
- Specs: `docs/07-frontend/pages/forgot-password.md`, `docs/07-frontend/pages/change-password.md`, `API-AUTH-FORGOT-PASSWORD`, `API-AUTH-CHANGE-PASSWORD`.
- Work items: `WORK-012`, `WORK-006`.

## Design
- Layout: centered `AuthLayout`/`CenteredAccountLayout`, matching Login/Forgot Password visually per `05-ui-ux/layout.md`.
- State ownership: form via React Hook Form + Zod; mutation via TanStack Mutation; no Redux involvement beyond reading `useAuth()` on the change-password page (route guard already handles redirect if unauthenticated).

## Validation
- Forgot password: `email` valid format.
- Change password: `currentPassword` non-empty, `newPassword` matches whatever policy `WORK-000` #6 settles, `confirmNewPassword` equals `newPassword`.

## Test Plan
- Unit tests: both Zod schemas.
- Component tests: forgot-password always shows the same success message; change-password shows field/root errors correctly and a success toast on completion.
- Report: `docs/08-testing/reports/frontend/WORK-013-password-pages-test-report.md`.

## Test Result
**PASS.** 17 tests for this item (7 schema tests, 4 mapChangePasswordError tests, 3 ForgotPasswordPage + 3 ChangePasswordPage component tests, all with mocked `authApiService`), part of the full `npx vitest run` result: 18 files / 94 tests, all passed. `npx tsc -b` and `npm run build` also succeeded. Full detail in `docs/08-testing/reports/frontend/WORK-013-password-pages-test-report.md`.

## Risks / Ambiguities
- Whether change-password invalidates the current session (forcing re-login) is unresolved; the page must handle either outcome without assuming one.
