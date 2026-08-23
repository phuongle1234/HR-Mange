---
id: WORK-002
type: workflow
module: global
status: draft
depends_on:
  - DB-ARCHITECTURE
  - DB-CONVENTIONS
  - DB-RELATIONSHIPS
  - DB-INDEXES
  - DB-MIGRATION-STRATEGY
  - DB-USER
  - DB-EMPLOYEE
  - DB-AUDIT-LOG
---

# WORK-002: Database Schema & Initial Migration

## Work Status
`IMPLEMENTED`

## Summary
Translate the draft entity specs (`DB-USER`, `DB-EMPLOYEE`, `DB-AUDIT-LOG`) into `backend/prisma/schema.prisma`, generate the first migration, and add the baseline seed script — but only once Department, the status enum, the delete strategy, and the permission model are decided, since all four change the shape of the schema.

## Scope
In scope:
- `User`, `Employee`, `AuditLog` Prisma models per the entity specs, using the naming/typing conventions in `DB-CONVENTIONS`.
- Indexes from `DB-INDEXES` that are unconditionally approved (e.g. `employees.employee_code`, `employees.email`, `users.email` uniqueness) — indexes that depend on undecided fields (`department_id`, `status`) are added only after `WORK-000` resolves them.
- First migration via `prisma migrate dev`, run against the local Docker `postgres` service (`infra/docker-compose.yml`).
- `prisma/seed.ts` with one placeholder admin `User` (no real personal data).

Out of scope:
- Department table itself, unless `WORK-000` decision #1 chooses to create one — if so, that becomes part of this item's scope, not a separate item.
- Any repository/service code that reads/writes these tables — that belongs to `WORK-005` onward.

## Dependencies
- Specs: all of `docs/04-database`.
- Work items: `WORK-000` (decisions #1–#4 required), `WORK-001` (needs the backend project + Prisma CLI to exist).

## Design
| Table | Purpose |
| --- | --- |
| `users` | Authenticated accounts; actor for audit/employee `createdBy`/`updatedBy`. |
| `employees` | Core managed entity for the Employee module. |
| `audit_logs` | Append-only record of important actions. |

Field-level detail is already written in `DB-USER`, `DB-EMPLOYEE`, `DB-AUDIT-LOG` — this item implements those tables as approved, it does not redesign them.

## Test Plan
- Migration tests: `prisma migrate dev` runs clean against a fresh local Postgres container; `prisma migrate deploy` runs clean against a second fresh database (simulating CI).
- Repository-level tests are out of scope here (no repository code yet) but uniqueness constraints (`employee_code`, `email` on both tables) should be exercised with a raw insert-duplicate test at the Prisma Client level.
- Commands: `npx prisma migrate dev --name init`, `npx prisma db seed`.
- Report: `docs/08-testing/reports/database/WORK-002-schema-test-report.md`.

## Test Result
PASS. `npx prisma migrate dev --name init` applied cleanly against the local Postgres container (`employeeos-postgres`); `npx prisma db seed` created the placeholder admin user. Verified table/column names and the `EmployeeStatus` enum via `psql \d`. End-to-end verified through the running API (create/read/update/delete employee + audit log rows) — see `docs/08-testing/reports/database/WORK-002-schema-test-report.md` for full detail, including the deliberate Prisma 6.x version pin.

## Risks / Ambiguities
- If Department is approved as its own table, this item's migration includes it and `DB-RELATIONSHIPS`/`DB-EMPLOYEE` need a follow-up spec update before the migration is written (per `WORKFLOW-CHANGE-MANAGEMENT`: spec before schema).
- Soft-delete vs hard-delete changes whether `employees.deleted_at` ships in this migration at all.
