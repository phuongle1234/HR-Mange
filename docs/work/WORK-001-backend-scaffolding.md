---
id: WORK-001
type: workflow
module: global
status: draft
depends_on:
  - TECH-BACKEND
  - SOLUTION-BACKEND-ARCHITECTURE
  - SOLUTION-LOGGING
  - SOLUTION-ERROR-HANDLING
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# WORK-001: Backend Project Scaffolding

## Work Status
`IMPLEMENTED`

## Summary
Create the empty NestJS project skeleton (no business modules yet) so `WORK-002` and the auth/employee API items have somewhere to be added: project config, the Controller→Service→Repository→Prisma layering shell, the shared response/error helpers, and daily-rotating logging.

## Scope
In scope:
- `backend/` NestJS + TypeScript project (`nest new` or equivalent manual setup), Prisma CLI installed (schema left empty — models are `WORK-002`'s scope).
- `ConfigModule` reading `.env` (matching keys already in `.env.example`).
- Global exception filter mapping thrown errors to the `{statusCode, code, message, fieldErrors, requestId}` shape from `API-ERROR-RESPONSE`.
- `ResponseHelper.success()` helper matching `API-CONVENTIONS`.
- `BaseService` / `BaseInterface` / `BaseRepository` shared contracts (generic CRUD signatures only, per `SOLUTION-BACKEND-ARCHITECTURE`).
- Daily-rotating file logger, 10-day retention, per `SOLUTION-LOGGING`; logger must not log secrets/passwords/tokens (`AGENTS.md`).

Out of scope:
- Any business module (`AuthModule`, `EmployeeModule`) — those belong to `WORK-005`+.
- Prisma schema/models — `WORK-002`.
- Password hashing / JWT library selection — depends on `WORK-000` decisions #5/#7.

## Dependencies
- Specs: `TECH-BACKEND`, `SOLUTION-BACKEND-ARCHITECTURE`, `SOLUTION-LOGGING`, `SOLUTION-ERROR-HANDLING`, `API-CONVENTIONS`, `API-ERROR-RESPONSE`.
- Work items: `WORK-000` (only the parts of this item that touch hashing/JWT libraries wait on decisions #5/#7; the rest of the scaffold does not).

## Implementation Notes
- Directory layout should match the module folder pattern already described in `SOLUTION-BACKEND-ARCHITECTURE` (controller/service/repository/dto/interfaces/tests per module) even though no modules exist yet.
- `infra/Dockerfile.backend` (already written) expects a `package.json` at `backend/` with a script reachable via `npx nest start --debug=0.0.0.0:9229 --watch` — verify the scaffold satisfies that command as-is.
- Do not add a health-check or any other endpoint not defined by a spec; scaffolding is infrastructure/tooling, not new API surface.

## Test Plan
- Unit tests: `ResponseHelper` success/error shape, exception filter mapping for a thrown sample error.
- HTTP tests: none yet (no real endpoint exists).
- Integration tests: none yet.
- Commands: document `npm install`, `npm run start:dev`, `npm run lint`, `npm run test` in `docs/08-testing/commands.md` once scripts are final.
- Report: `docs/08-testing/reports/backend/WORK-001-scaffolding-test-report.md`.

## Test Result
PASS. `npm run build` compiles cleanly. `npm run test` (scaffolding-specific suites: `response.helper.spec.ts`, `http-exception.filter.spec.ts`) — 4/4 passed. Full backend suite: 6/6 test suites, 33/33 tests passed. Manually verified via `node dist/src/main.js` that the app boots, `X-Request-Id` is set on every response, and errors are returned in the `{statusCode, code, message, fieldErrors, requestId}` envelope. Deviations (Prisma major-version pin, winston logger choice, `@nestjs/event-emitter` transport choice) are recorded in `docs/08-testing/reports/backend/WORK-001-scaffolding-test-report.md`.

## Risks / Ambiguities
- Exact NestJS/Node version pinning is pending (`TECH-BACKEND` pending decisions).
- Logger library choice (`winston`, `nestjs-pino`, or built-in) is not approved.
- ESLint/Prettier ruleset is not specified anywhere; a minimal reasonable default is proposed if not clarified, and must be called out as an assumption in the test report.
