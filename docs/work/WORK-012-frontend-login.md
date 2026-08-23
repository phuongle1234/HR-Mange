---
id: WORK-012
type: workflow
module: auth
status: draft
depends_on:
  - FRONTEND-AUTH-LOGIN
  - API-AUTH-LOGIN
  - 07-FRONTEND-REACT-ROUTE
  - 07-FRONTEND-AUTH-PROVIDER
---

# WORK-012: Frontend Page — Login

## Work Status
`IMPLEMENTED` — `LoginPage`, real `AuthProvider`/`useAuth()`, and `useLoginMutation()` are built against the documented `POST /api/auth/login` contract. Frontend work proceeded without waiting on `WORK-005` (backend) being live, per this task's instruction to build against the documented API contract; the real backend was not running during implementation or testing, so no live end-to-end login has been verified yet — only the contract-mocked component/unit tests below.

## Summary
Implement `LoginPage` per `FRONTEND-AUTH-LOGIN`, and bring the previously-stubbed `AuthProvider`/`PermissionProvider` from `WORK-003` to life: this is the first item that actually authenticates a user and stores session state in Redux.

## Scope
In scope:
- `src/features/auth/pages/LoginPage.tsx` at route `/login`, per `FRONTEND-AUTH-LOGIN`.
- Real `AuthProvider` behavior: call `GET /api/auth/me` on load to determine `authStatus`, expose `useAuth()`.
- `useLoginMutation()` calling `POST /api/auth/login` through the centralized Axios client from `WORK-003`.
- Navigation to `/employees` (or the approved return URL — currently only "proposed", per spec) after successful login.

Out of scope:
- Forgot/change password pages (`WORK-013`).
- Employee pages (`WORK-014`+).

## Dependencies
- Specs: `FRONTEND-AUTH-LOGIN`, `API-AUTH-LOGIN`, `07-frontend/react-route.md`, `07-frontend/providers/auth-provider.md`.
- Work items: `WORK-003`, `WORK-005`.

## Design
- Layout: centered `AuthLayout` (no navbar/sidebar), per `05-ui-ux/layout.md`.
- State ownership: form via React Hook Form + Zod; mutation status via TanStack Mutation; authenticated user via Redux through `AuthProvider`.
- Error mapping: `INVALID_CREDENTIALS` → generic form-level error; `VALIDATION_ERROR` → field errors; never reveal whether the email exists.

## Validation
- React Hook Form/Zod: `email` (valid format), `password` (non-empty).
- Form-level error: shown on `INVALID_CREDENTIALS`/`TOO_MANY_REQUESTS`, using the safe messages from `API-AUTHENTICATION`.

## Test Plan
- Unit tests: login Zod schema, error-mapping helper.
- Component tests: renders form, shows validation errors, shows generic credential error, redirects on success (mocked mutation).
- API service tests: `useLoginMutation` against a mocked Axios client.
- Report: `docs/08-testing/reports/frontend/WORK-012-login-test-report.md`.

## Test Result
**PASS.** 9 tests for this item (3 login-schema, 3 mapLoginError, 3 LoginPage component tests with mocked `authApiService.login`), part of the full `npx vitest run` result: 18 files / 94 tests, all passed. `npx tsc -b` and `npm run build` also succeeded. Full detail in `docs/08-testing/reports/frontend/WORK-012-login-test-report.md`.

## Risks / Ambiguities
- Exact token/cookie transport (`WORK-000` #5) determines whether the Axios client needs `withCredentials` or an `Authorization` header — must match whatever `WORK-005` implemented.
- Return-URL-after-login behavior is only "proposed", not approved.
