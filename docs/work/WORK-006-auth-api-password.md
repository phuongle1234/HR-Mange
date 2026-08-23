---
id: WORK-006
type: workflow
module: auth
status: draft
depends_on:
  - API-AUTHENTICATION
---

# WORK-006: Auth API — Forgot Password & Change Password

## Work Status
`IMPLEMENTED`

## Summary
Implement `POST /api/auth/change-password` and `POST /api/auth/forgot-password` from `API-AUTHENTICATION`, both of which must stay silent about whether an account/email exists or which field was wrong.

## Scope
In scope:
- `API-AUTH-CHANGE-PASSWORD`: verify current password, enforce policy, hash and store new password, no session-invalidation decision assumed unless `WORK-000` settles it.
- `API-AUTH-FORGOT-PASSWORD`: always return the same safe message regardless of whether the email exists; reset-token creation and delivery channel only implemented once approved (currently pending — if still unapproved when this item starts, ship the safe-response contract without an actual reset-token/email side effect, and record that as a known gap).

Out of scope:
- Actual email/SMS delivery integration, unless a delivery channel is approved before this item starts.
- Login/me/logout (`WORK-005`).

## Dependencies
- Specs: `API-AUTHENTICATION` (`API-AUTH-CHANGE-PASSWORD`, `API-AUTH-FORGOT-PASSWORD` sections).
- Work items: `WORK-005` (needs `AuthGuard`/`CurrentUser`), `WORK-000` (#6 password policy, and reset-token/delivery decisions if forgot-password is to do more than return a safe message).

## Endpoint Design
| Endpoint | Method | Auth | Permission |
| --- | --- | --- | --- |
| `/api/auth/change-password` | POST | required | none |
| `/api/auth/forgot-password` | POST | public | none |

## Validation
| Field | Rule |
| --- | --- |
| `currentPassword` | required, non-empty |
| `newPassword` | required, must satisfy the policy from `WORK-000` #6 |
| `confirmNewPassword` | required, must equal `newPassword` |
| `email` (forgot-password) | required, valid email format |

## Error Handling
| Code | Status | Mapping |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Field validation failure |
| `CURRENT_PASSWORD_INVALID` | 400 | Safe message, change-password only |
| `PASSWORD_POLICY_FAILED` | 400 | Safe policy message |
| `UNAUTHORIZED` | 401 | Missing/invalid session, change-password only |

## Database Impact
- Tables/entities: `users` (password hash update).
- Transactions: not required.
- Audit log: `PASSWORD_CHANGED`, `PASSWORD_RESET_REQUESTED` candidate actions — same note as `WORK-005` regarding `WORK-011` sequencing.
- Events: none beyond the optional audit events above.

## Test Plan
- Unit tests: change-password with correct/incorrect current password, policy rejection; forgot-password with existing/non-existing email returning identical response.
- HTTP tests: `test/http/auth/change-password.http`, `forgot-password.http`.
- Integration tests: change password then confirm login with the new password succeeds and the old one fails.
- Report: `docs/08-testing/reports/auth/WORK-006-password-test-report.md`.

## Test Result
PASS. Unit tests: `AuthService > changePassword` 4/4, `AuthService > forgotPassword` 2/2. Manually verified `change-password` (success, wrong current password, policy failure, confirmation mismatch) and `forgot-password` (identical generic response for registered/unregistered emails, validation error for a malformed email) against the running server. Full detail in `docs/08-testing/reports/auth/WORK-006-password-test-report.md`.

## Risks / Ambiguities
- Whether change-password invalidates other active sessions is unresolved (`API-AUTHENTICATION` Pending Decisions).
- Reset-token lifetime and delivery channel are unresolved; shipping forgot-password without a real reset flow is an explicit, documented gap, not a silent omission.
