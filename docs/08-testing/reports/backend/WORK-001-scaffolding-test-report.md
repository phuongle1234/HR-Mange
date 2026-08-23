# WORK-001 Test Report — Backend Scaffolding

## Feature
NestJS + TypeScript backend scaffold at `backend/`: `ConfigModule` reading `.env`, global `ValidationPipe` (whitelist + transform) with a structured validation-exception factory, global exception filter producing the `{ statusCode, code, message, fieldErrors, requestId }` envelope, `ResponseHelper.success()`, `BaseService`/`IBaseService` (+ `IBaseRepository`) generic contracts, a request-id middleware, and a daily-rotating winston file logger that never logs request bodies, passwords, or tokens.

## Files Changed
- `backend/package.json`, `backend/nest-cli.json`, `backend/tsconfig*.json`, `backend/.eslintrc.js`, `backend/.prettierrc`, `backend/.gitignore` (Nest CLI scaffold, then trimmed of the default hello-world controller/service)
- `backend/src/main.ts`, `backend/src/app.module.ts`
- `backend/src/config/configuration.ts`
- `backend/src/common/constants/{error-code,app,audit-action}.constant.ts`
- `backend/src/common/exceptions/app.exception.ts`
- `backend/src/common/helpers/response.helper.ts`
- `backend/src/common/interfaces/{base,base-repository}.interface.ts`
- `backend/src/common/services/base.service.ts`
- `backend/src/common/filters/http-exception.filter.ts`
- `backend/src/common/pipes/validation-exception-factory.ts`
- `backend/src/common/middleware/{request-id,http-logger}.middleware.ts`
- `backend/src/common/guards/jwt-auth.guard.ts`
- `backend/src/common/decorators/current-user.decorator.ts`
- `backend/src/common/logger/{sensitive-keys.constant,redact.util,winston.factory,app-logger.service,logger.module}.ts`
- `backend/src/common/utils/password-policy.util.ts`
- `backend/src/prisma/{prisma.service,prisma.module}.ts`
- `backend/src/common/helpers/tests/response.helper.spec.ts`
- `backend/src/common/filters/tests/http-exception.filter.spec.ts`
- Removed: `backend/src/app.controller.ts`, `backend/src/app.service.ts`, `backend/src/app.controller.spec.ts` (scaffolding must not add an endpoint not defined by a spec)

## Commands Run
```
npx @nestjs/cli new backend --package-manager npm --skip-git
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/event-emitter passport passport-jwt bcryptjs class-validator class-transformer winston winston-daily-rotate-file uuid
npm install -D prisma @types/passport-jwt @types/bcryptjs @types/uuid
npm run build
npm run test
```

## Actual Result
- `npm run build` → PASS (exit 0, `dist/` produced, no TypeScript errors).
- `npm run test` (relevant suites: `response.helper.spec.ts`, `http-exception.filter.spec.ts`) → PASS, 4 tests (2 per suite), 0 failed.
- Manual smoke test: ran `node dist/src/main.js`, confirmed the app boots on `APP_PORT` from `.env`, `X-Request-Id` header is present on every response, and an unauthenticated request returns the `{statusCode, code, message, requestId}` envelope (`401 UNAUTHORIZED`) rather than a raw Nest error.
- Full-suite numbers (all modules, see other reports for detail): `Test Suites: 6 passed, 6 total`, `Tests: 33 passed, 33 total`.

## Known Issues / Deviations
- **Prisma major version**: the environment's default `npx prisma init` resolved to Prisma 7 (new `prisma.config.ts`/custom generator-output architecture, and it also scaffolded unrelated `.claude/`/`.windsurf/`/`.agents/` skill folders). That is incompatible with the Dockerfile constraint "`npm ci` alone must be enough to run the app" (Prisma 7's `@prisma/client` does not guarantee an automatic postinstall `prisma generate` the way the classic package does). Downgraded to `prisma@6.19.3` / `@prisma/client@6.19.3`, which has a `postinstall` script that runs `prisma generate` automatically — confirmed this satisfies the Dockerfile's `npm ci` requirement. Flagged for confirmation: pin the major version explicitly if Prisma 7 support is later required.
- Logger library: `docs/02-solution/logging.md` left the library unspecified ("Pending Decision"). Chose `winston` + `winston-daily-rotate-file` per the task's explicit instruction; retention is driven by `LOG_RETENTION_DAYS` (default 10), file at `backend/logs/application-YYYY-MM-DD.log`.
- Event transport: `docs/02-solution/event-driven.md` left the transport unspecified. Chose in-process `@nestjs/event-emitter` (`EventEmitterModule.forRoot()`), consistent with WORK-011's own instruction to name the transport and treat that as the resolution.
- No health-check or other endpoint was added beyond what the API spec defines, per WORK-001's own scope note.
