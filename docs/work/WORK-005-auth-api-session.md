---
id: WORK-005
type: workflow
module: auth
status: draft
depends_on:
  - API-AUTHENTICATION
  - SOLUTION-AUTHENTICATION
  - DB-USER
---

# WORK-005: Auth API — Login, Me, Logout

## Work Status
`IMPLEMENTED`

## Summary
Implement the session-establishing endpoints from `API-AUTHENTICATION`: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, plus the `AuthGuard`/`CurrentUser` decorator infrastructure every other authenticated endpoint depends on.

## Scope
In scope:
- Endpoints: `API-AUTH-LOGIN`, `API-AUTH-ME`, `API-AUTH-LOGOUT` exactly as specified.
- `AuthModule`: `AuthController`, `AuthService` (extends `BaseService` where applicable), `UserRepository`.
- JWT issuance/verification using whatever token transport `WORK-000` decision #5 settles on.
- `AuthGuard` + `@CurrentUser()` decorator reused by every later authenticated endpoint (`WORK-006` onward).

Out of scope:
- Change-password / forgot-password (`WORK-006`).
- Any employee endpoint.

## Dependencies
- Specs: `API-AUTHENTICATION` (`API-AUTH-LOGIN`, `API-AUTH-ME`, `API-AUTH-LOGOUT` sections), `SOLUTION-AUTHENTICATION`, `DB-USER`.
- Work items: `WORK-000` (#5 token transport, #7 hashing library), `WORK-001` (backend scaffold), `WORK-002` (`users` table must exist).

## Endpoint Design
| Endpoint | Method | Auth | Permission |
| --- | --- | --- | --- |
| `/api/auth/login` | POST | public | none |
| `/api/auth/me` | GET | required | none |
| `/api/auth/logout` | POST | required | none |

## Validation
| Field | Rule |
| --- | --- |
| `email` (login) | required, valid email format |
| `password` (login) | required, non-empty (exact password rules pending `WORK-000` #6) |

## Error Handling
| Code | Status | Mapping |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | DTO validation failure |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password — generic message, never reveals which |
| `UNAUTHORIZED` | 401 | Missing/invalid session on `/me` or `/logout` |
| `USER_DISABLED` | 403 | Only if `isActive` gating is confirmed live |

## Database Impact
- Tables/entities: `users` (read for login/me, `lastLoginAt` update on successful login).
- Transactions: not required (single-row read/update).
- Audit log: `LOGIN_SUCCEEDED` / `LOGIN_FAILED` candidate actions — actual wiring happens in `WORK-011`; this item may emit the event even if the listener isn't built yet, or defer emission until `WORK-011`, whichever avoids dead code — record the choice made in the test report.
- Events: none required beyond the optional audit events above.

## Test Plan
- Unit tests: `AuthService.login` (success, wrong password, unknown email — all resolve to the same `INVALID_CREDENTIALS`), `AuthGuard` (valid/invalid/missing token).
- HTTP tests: `test/http/auth/login.http`, `me.http`, `logout.http`.
- Integration tests: login against the real `WORK-002` database, then `/me` with the issued token.
- Commands: documented once test runner is chosen in `WORK-001`.
- Report: `docs/08-testing/reports/auth/WORK-005-session-test-report.md`.

## Test Result
PASS. Unit tests: `AuthService > login` 4/4, `JwtStrategy` 3/3. Manually verified `login`/`me`/`logout` against the running server, including the 401 UNAUTHORIZED path with no token. Uses `bcryptjs` instead of native `bcrypt` (documented deviation). Full detail in `docs/08-testing/reports/auth/WORK-005-session-test-report.md`.

## Risks / Ambiguities
- Exact response shape for `/me` (`permissions` array) depends on `WORK-000` #4 (permission model).
- Whether `/logout` does anything server-side (vs. purely client-side token discard) depends on #5.
