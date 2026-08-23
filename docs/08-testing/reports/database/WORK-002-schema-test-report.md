# WORK-002 Test Report — Database Schema

## Feature
Prisma schema with exactly three models (`User`, `Employee`, `AuditLog`) matching `docs/04-database/entities/*.md` and the WORK-000 resolved decisions (no Department, no role/permission columns, hard delete/no `deletedAt`, `EmployeeStatus` enum, field lengths, `AuditLog.action` as a plain string). Initial migration applied to local Postgres, plus a seed script creating one placeholder admin user.

## Files Changed
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260821132128_init/migration.sql`
- `backend/prisma/seed.ts`
- `backend/package.json` (`"prisma": { "seed": "ts-node prisma/seed.ts" }`, `@prisma/client`/`prisma` dependencies)
- `backend/.env` (local `DATABASE_URL`, mirrors repo-root `.env.example` variable names)

## Commands Run
```
npx prisma init --datasource-provider postgresql
npx prisma migrate dev --name init
npx prisma db seed
```

## Actual Result
- `npx prisma migrate dev --name init` → PASS. Output: "Applying migration `20260821132128_init`" ... "Your database is now in sync with your schema." Prisma Client generated successfully (v6.19.3).
- `npx prisma db seed` → PASS. Output: `Seeded placeholder admin user: admin@employeeos.local (id=58bb1636-f675-45ea-a1bd-f4fcad3f66f7)`.
- Verified via `docker exec employeeos-postgres psql -U postgres -d employee_management -c "\d users" / "\d employees" / "\d audit_logs"` (ad hoc, not saved) that all three tables exist with the expected snake_case column names and the `employee_status` enum.
- End-to-end verification (see WORK-007–011 reports): created/read/updated/deleted employees through the running API and confirmed corresponding rows appear in `audit_logs` with the correct `action`/`payload` shape.
- Seed credentials for manual testing (development placeholder only, not a real/production credential):
  - email: `admin@employeeos.local`
  - password: `ChangeMe123`

## Known Issues / Deviations
- **Prisma major version pinned to 6.x, not the latest 7.x** — see WORK-001 report for the reason (Dockerfile's `npm ci`-only constraint needs the classic `@prisma/client` postinstall-generate behavior). `package.json#prisma` seed config is flagged by Prisma 6 as deprecated in favor of a `prisma.config.ts` file (removed in Prisma 7); left as-is intentionally since we are pinned to 6.x.
- `createdByUserId`/`updatedByUserId` on `Employee` and `performedByUserId` on `AuditLog` have no `onDelete` behavior specified in any spec document; left at Prisma's default (`Restrict`) rather than inventing a cascade/set-null rule. Flagged for confirmation.
- `AuditLog.action` is a plain `varchar(50)`, not a Prisma enum, per `docs/04-database/entities/audit-log.md` ("Reserved as a plain string ... until the action list is finalized").
