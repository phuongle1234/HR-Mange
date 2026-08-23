# Employee Management System — Backend

NestJS + TypeScript + Prisma + PostgreSQL backend for the Employee Management System. Implements `WORK-001`–`WORK-011`: scaffolding, database schema, authentication (stateless bearer JWT, no roles/permissions), Employee CRUD, and an audit-log event listener.

Layering (see `AGENTS.md` at the repo root): `Controller -> Service -> Repository -> Prisma -> PostgreSQL`.

## Prerequisites
- Node.js 20+ (Dockerfile pins `node:20-alpine`), npm 10+
- A reachable PostgreSQL instance matching `DATABASE_URL` in `.env` (locally: `docker compose --project-directory .. -f ../infra/docker-compose.yml up -d postgres` from this directory, or from the repo root: `docker compose --project-directory . -f infra/docker-compose.yml up -d postgres`)

## Setup
```bash
npm install
npx prisma migrate dev --name init   # only needed the first time / after a schema change; already applied in this repo
npx prisma db seed                    # creates one placeholder admin user
```

Seed credentials (development placeholder only — rotate before any shared/staging use):
- email: `admin@employeeos.local`
- password: `abc@12345678`

## Running locally
```bash
npm run start:dev     # nest start --watch, reads ./.env
```
The app listens on `APP_PORT` (default `3000`) with the global prefix `/api`, e.g. `POST http://localhost:3000/api/auth/login`.

## Running via Docker Compose
From the repo root:
```bash
docker compose --project-directory . -f infra/docker-compose.yml up -d postgres
docker compose --project-directory . -f infra/docker-compose.yml up backend
```
The container runs `npx nest start --debug=0.0.0.0:9229 --watch` (see `infra/Dockerfile.backend`); attach a debugger on `BACKEND_DEBUG_PORT` (default `9229`). Inside Docker, `DATABASE_URL`'s host is the `postgres` service name (injected via `environment:` in `docker-compose.yml`), not `localhost` — this overrides the value in `.env`, which is for host-run `npm run start:dev` only.

## Testing
```bash
npm run build      # compiles with tsc via nest build
npm run test        # Jest unit tests (services, JWT strategy, exception filter, response helper, audit log listener)
npm run test:watch
npm run test:cov
```
Manual HTTP request files (for a REST client such as the VS Code "REST Client" extension) live under `test/http/{auth,employee}/*.http`. Each file declares `@baseUrl` and, where needed, `@access_token`/`@employee_id` client variables — obtain `@access_token` from a `POST {{baseUrl}}/auth/login` response using the seed credentials above.

## Environment variables
Read from `.env` (see `.env.example` at the repo root for the canonical list). Only these are used by this phase — `JWT_REFRESH_*` exist in the env file but are unused (no refresh token, stateless bearer JWT only):
- `NODE_ENV`, `APP_PORT`, `FRONTEND_URL`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`
- `LOG_RETENTION_DAYS`

## Project structure
```
src/
  common/         constants, exceptions, filters, guards, decorators, logger, middleware, base service/interfaces, response helper
  config/         typed ConfigModule configuration factory
  prisma/         PrismaService / PrismaModule
  modules/
    auth/         controller / service / repository / dto / interfaces / strategy / tests
    employee/     controller / service / repository / dto / interfaces / events / tests
    audit-log/    listener / repository / interfaces
prisma/
  schema.prisma   User / Employee / AuditLog models
  seed.ts         placeholder admin user
test/http/        .http request files, one per endpoint group
```

## Known deviations from older spec text (see `docs/work/WORK-0*` test reports for full detail)
- Password hashing uses `bcryptjs` (pure JS) instead of the native `bcrypt` package, to avoid a Windows native-build toolchain dependency.
- Prisma is pinned to the 6.x line rather than the latest 7.x, because `@prisma/client@6`'s automatic postinstall `prisma generate` is required for `npm ci` alone (as run by `infra/Dockerfile.backend`) to produce a runnable app.
- Event transport between `EmployeeService` and the audit-log listener is in-process `@nestjs/event-emitter` (no queue).
