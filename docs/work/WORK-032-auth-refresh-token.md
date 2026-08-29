---
id: WORK-032
type: feature
module: auth
status: draft
depends_on:
  - WORK-005
  - WORK-012
---

# WORK-032: Auth Refresh Token And Axios Silent Refresh

## Work Status
`DRAFT` - requested after confirming the current project has no refresh-token API and no frontend Axios refresh flow. This task is not implementation-authorized yet; update/approve the related specs first, then start coding only after a separate explicit user instruction.

## Summary
Add a refresh-token based authentication flow so expired access tokens can be refreshed without immediately logging the user out. The backend must issue and validate refresh tokens safely, and the frontend Axios layer must retry eligible `401` requests once after a successful refresh.

Current state:
- Backend auth is stateless bearer access-token only.
- There is no `POST /api/auth/refresh` endpoint.
- Frontend stores only `employeeos.accessToken`.
- `frontend/src/shared/api/api-client.ts` clears auth on every `401` and does not retry.
- Existing specs explicitly say there is no refresh token in this phase, so those specs must be changed before implementation.

## Scope
In scope:
- Update auth API, solution, frontend, and database specs for refresh-token behavior.
- Backend refresh token issue/rotate/revoke flow.
- Backend login response and refresh endpoint contract.
- Logout behavior that invalidates/revokes the current refresh token when applicable.
- Frontend token storage changes needed for the selected refresh-token strategy.
- Axios response interceptor flow:
  - On eligible `401`, call refresh once.
  - Deduplicate concurrent refresh calls.
  - Replay the original request once with the new access token.
  - If refresh fails, clear auth and redirect via existing auth guard behavior.
- Keep sensitive values out of logs, Redux, URL params, and rendered UI.
- Update memory/session/history after implementation.

Out of scope:
- OAuth/social login.
- Multi-device session management UI.
- Admin session revocation screens.
- Remember-me UI unless separately specified.
- Automated tests unless the user explicitly requests tests in the implementing prompt.

## Required Specs To Read / Update
Before coding, read the applicable backend + frontend spec sets from `AGENTS.md`.

Specs expected to change:
- `docs/06-api/authentication.md`
- `docs/07-frontend/authentication.md`
- `docs/07-frontend/providers/auth-provider.md`
- `docs/07-frontend/api-client.md`
- `docs/02-solution/authentication.md`
- Database specs under `docs/04-database/` if refresh tokens are persisted server-side.

## Design Requirements
Backend:
- Decide and document whether refresh tokens are stored as hashed DB rows, httpOnly cookies, or another approved strategy.
- If persisted, store only a hash of the refresh token, never the raw token.
- Rotate refresh tokens on every refresh.
- Revoke refresh tokens on logout where the token is available.
- Do not log refresh tokens, access tokens, authorization headers, cookies, or token hashes.
- Keep controller thin; validation belongs in DTOs/guards/pipes; auth business logic belongs in the auth service layer.
- If a new entity/table is added, update database specs before Prisma schema/migration.

Frontend:
- `api-client.ts` remains the single Axios attach/retry boundary.
- Page components must not manually call refresh.
- Request interceptor attaches the latest access token.
- Response interceptor retries a failed request at most once.
- Concurrent `401` responses must share one in-flight refresh call.
- Failed refresh clears stored auth and dispatches `clearAuth()`.
- Do not show duplicate toasts for expected refresh attempts.

## Proposed API Shape
Pending approval; do not implement until specs settle.

```text
POST /api/auth/login
→ { accessToken, refreshToken? | set-cookie, user }

POST /api/auth/refresh
→ { accessToken, refreshToken? | set-cookie, user? }

POST /api/auth/logout
→ revokes refresh token when available
```

## Validation / Error Handling
- Expired/invalid access token on ordinary API call should trigger one refresh attempt.
- Invalid/expired/reused refresh token should clear auth and require login.
- Replay failure after refresh should surface the normalized original API error.
- Add or document safe error codes such as `REFRESH_TOKEN_INVALID` only through API specs.

## Test Plan
- Per current project rule, do not create/run tests unless the user explicitly asks for tests in the implementation request.
- Permitted verification without tests:
  - backend build
  - frontend build
  - manual login/refresh/logout walkthrough

## Risks / Ambiguities
- Refresh-token transport is not yet decided: httpOnly cookie is safer against XSS, while returning refresh tokens to JavaScript is simpler but weaker.
- Current frontend auth provider spec explicitly says no refresh token; it must be amended before code.
- Current backend auth module is known non-compliant with the newer `BaseService` architecture rule; do not migrate that architecture as a side effect unless the user explicitly includes it in this task.
- If refresh tokens are persisted, the database model and migration must be specified first.

