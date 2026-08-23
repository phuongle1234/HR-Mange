---
id: TEST-COMMANDS
type: testing
module: global
status: approved
---

# Commands

## Purpose
Document test command expectations.

## Command Documentation Rules
Each implementation task must document:
- Command.
- Working directory.
- Purpose.
- Result.
- Failure details if any.

## Backend Commands (`backend/`, real scripts from `backend/package.json`, verified as of WORK-001–WORK-011)
```text
npm install                # install dependencies (also runs `prisma generate` via @prisma/client's postinstall hook)
npx prisma migrate dev --name <name>   # create/apply a migration against the local Postgres (dev only)
npx prisma migrate deploy              # apply existing migrations only (CI/staging/prod) - never generates new ones
npx prisma db seed         # create the placeholder admin user (see prisma/seed.ts)
npm run build              # nest build -> dist/ ; verified: compiles cleanly, no TypeScript errors
npm run start              # nest start
npm run start:dev          # nest start --watch (local dev)
npm run start:debug        # nest start --debug --watch
npm run start:prod         # node dist/main
npm run lint                # eslint --fix over src/apps/libs/test
npm run test                 # jest unit tests; verified: 6 suites / 33 tests, all passing
npm run test:watch
npm run test:cov
npm run test:e2e             # jest -c test/jest-e2e.json; no e2e specs exist yet (unit tests + .http files are this phase's test artifacts)
```

Docker (from repo root, per `infra/docker-compose.yml`):
```text
docker compose --project-directory . -f infra/docker-compose.yml up -d postgres
docker compose --project-directory . -f infra/docker-compose.yml up backend
```

Frontend: unchanged from the draft category below - owned by the frontend work items (`WORK-003`, `WORK-012`-`WORK-017`), not verified by this backend pass.
```text
npm run test
npm run build
npm run lint
```

HTTP/API (real paths, verified against a running `npm run start:dev`/`node dist/src/main.js` instance):
```text
backend/test/http/auth/{login,me,logout,change-password,forgot-password}.http
backend/test/http/employee/{create-employee,get-employee,get-employees,update-employee,delete-employee}.http
```
Each `.http` file declares `@baseUrl` and (where needed) `@access_token`/`@employee_id` client variables; obtain `@access_token` from a `POST {{baseUrl}}/auth/login` response first (seed credentials are documented in `docs/08-testing/reports/database/WORK-002-schema-test-report.md`).

## Result Rules
- `passed`: command executed and passed.
- `failed`: command executed and failed.
- `not run`: command was not executed; reason required.
- `blocked`: could not run due dependency/environment issue; reason required.

## Resolved
- Package scripts above are the real, verified `backend/package.json` scripts (Nest CLI default set, unmodified) - no longer a pending decision.
- Test runner is Jest (`ts-jest`, `testEnvironment: node`), the Nest CLI default - no longer a pending decision.
