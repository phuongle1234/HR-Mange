# WORK-005 Test Report — Auth API: Session (login / me / logout)

## Feature
`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`. Stateless bearer JWT only (no refresh token, no server-side session store per WORK-000 decision #4). `login` returns `{ accessToken, user }` in the body; `logout` is a no-op success kept for contract symmetry. `JwtAuthGuard` + `JwtStrategy` implement the entire authorization model for this system: valid, non-expired JWT for a still-active user — no roles/permissions anywhere.

## Files Changed
- `backend/src/modules/auth/auth.module.ts`
- `backend/src/modules/auth/controller/auth.controller.ts`
- `backend/src/modules/auth/service/auth.service.ts`
- `backend/src/modules/auth/repository/user.repository.ts`
- `backend/src/modules/auth/strategy/jwt.strategy.ts`
- `backend/src/modules/auth/dto/{login,auth-response}.dto.ts`
- `backend/src/modules/auth/interfaces/{auth-service,user-repository}.interface.ts`
- `backend/src/common/guards/jwt-auth.guard.ts`
- `backend/src/common/decorators/current-user.decorator.ts`
- `backend/src/modules/auth/service/tests/auth.service.spec.ts` (login block)
- `backend/src/modules/auth/strategy/tests/jwt.strategy.spec.ts`
- `backend/test/http/auth/{login,me,logout}.http`

## Commands Run
```
npm run test -- --verbose
node dist/src/main.js   # manual run, then curl against it
```

## Actual Result
- Unit tests (login-related): `AuthService > login` — 4/4 passed (success; wrong email; wrong password; disabled user). `JwtStrategy` — 3/3 passed (valid active user; user no longer exists; user disabled).
- Manual HTTP verification against the running server (matches every case in `test/http/auth/{login,me,logout}.http`):
  - `POST /api/auth/login` with seed credentials → `200`, `{"success":true,"message":"Login successful.","data":{"accessToken":"...","user":{"id":"...","email":"admin@employeeos.local","fullName":"Placeholder Admin"}},"meta":null}`.
  - `GET /api/auth/me` with the returned token → `200` with the same user shape.
  - `GET /api/employees` with no `Authorization` header → `401 {"code":"UNAUTHORIZED",...}` (confirms the guard is active; the same guard protects `/me` and every employee route).
  - `POST /api/auth/logout` with a valid token → `200 {"success":true,"message":"Logged out successfully.","data":null,"meta":null}`.
- Full-suite numbers: `Test Suites: 6 passed, 6 total`, `Tests: 33 passed, 33 total`.

## Known Issues / Deviations
- **Password hashing**: uses `bcryptjs` (pure JS) instead of the native `bcrypt` package referenced in some older spec text, to avoid a Windows native-build toolchain dependency (WORK-000 decision #7, deliberate and documented).
- WORK-005's own spec text still shows a `permissions`/role-flavored `/me` response as an open risk; per WORK-000 decision #2, that model does not exist — `/me` returns only `{ id, email, fullName }`.
