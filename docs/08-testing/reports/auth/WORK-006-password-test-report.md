# WORK-006 Test Report — Auth API: Password (change-password / forgot-password)

## Feature
`POST /api/auth/change-password` (authenticated) and `POST /api/auth/forgot-password` (public, always returns the same generic message and never reveals whether an email is registered — no email/SMS delivery integration in this phase). Password policy: minimum 8 characters, at least one letter and one number (WORK-000 decision #6).

## Files Changed
- `backend/src/modules/auth/controller/auth.controller.ts` (`changePassword`, `forgotPassword` handlers)
- `backend/src/modules/auth/service/auth.service.ts` (`changePassword`, `forgotPassword` methods)
- `backend/src/modules/auth/dto/{change-password,forgot-password}.dto.ts`
- `backend/src/common/utils/password-policy.util.ts`
- `backend/src/common/exceptions/app.exception.ts` (`CurrentPasswordInvalidException`, `PasswordPolicyFailedException`)
- `backend/src/common/constants/app.constants.ts` (`PASSWORD_MIN_LENGTH`, `PASSWORD_POLICY_REGEX`, `GENERIC_FORGOT_PASSWORD_MESSAGE`)
- `backend/src/modules/auth/service/tests/auth.service.spec.ts` (`changePassword`/`forgotPassword` blocks)
- `backend/test/http/auth/{change-password,forgot-password}.http`

## Commands Run
```
npm run test -- --verbose
node dist/src/main.js   # manual run, then curl against it
```

## Actual Result
- Unit tests: `AuthService > changePassword` — 4/4 passed (success; wrong current password → `CURRENT_PASSWORD_INVALID`; policy failure → `PASSWORD_POLICY_FAILED`; confirmation mismatch → `VALIDATION_ERROR`). `AuthService > forgotPassword` — 2/2 passed (registered and unregistered email both resolve without throwing).
- Manual HTTP verification (matches `test/http/auth/{change-password,forgot-password}.http`):
  - Correct current password + valid new password → `200 {"success":true,"message":"Password changed successfully.",...}`.
  - Wrong current password → `400 {"code":"CURRENT_PASSWORD_INVALID",...}`.
  - New password without a digit (`onlyletters`) → `400 {"code":"PASSWORD_POLICY_FAILED",...}`.
  - `confirmNewPassword` not matching `newPassword` → `400 {"code":"VALIDATION_ERROR","fieldErrors":{"confirmNewPassword":[...]}}`.
  - `forgot-password` with a registered email and with an unregistered email both returned the identical `200` body: `{"message":"If the email is registered, password reset instructions will be sent.",...}`.
  - `forgot-password` with `"not-an-email"` → `400 {"code":"VALIDATION_ERROR",...}`.
- Full-suite numbers: `Test Suites: 6 passed, 6 total`, `Tests: 33 passed, 33 total`.

## Known Issues / Deviations
- `forgot-password` has no actual email/SMS delivery integration — it only validates the request shape and resolves; this matches the task's explicit instruction ("forgot-password only needs to return the safe generic message; no email/SMS delivery integration").
- Whether `change-password` should invalidate other active sessions is unresolved in spec; since there is no server-side session store at all in this phase (stateless JWT), there is nothing to invalidate — flagged as consistent with WORK-000 decision #4 rather than an open gap.
- Auth-event auditing (e.g. a `PASSWORD_CHANGED` audit row) is explicitly out of scope per WORK-000 decision #9 — not implemented.
