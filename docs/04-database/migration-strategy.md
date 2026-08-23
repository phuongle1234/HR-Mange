---
id: DB-MIGRATION-STRATEGY
type: database
module: global
status: draft
---

# Migration Strategy

Draft database specification. No Prisma schema or migration is created in this phase.

## Purpose
Define how database changes will be authored, reviewed, and applied once Prisma schema work is approved.

## Tooling
- Migrations are authored and applied with Prisma Migrate.
- Local development: `prisma migrate dev` (generates a migration from schema changes and applies it to the dev database).
- CI / staging / production: `prisma migrate deploy` (applies already-generated, committed migrations only; never generates new ones in these environments).

## Change Flow
1. A database change is first described/updated in the relevant `docs/04-database` spec (entity file, relationships, indexes, or conventions), per `WORKFLOW-CHANGE-MANAGEMENT`.
2. Only after the spec update is committed is `prisma/schema.prisma` changed to match.
3. `prisma migrate dev --name <change-description>` generates the migration file.
4. The migration file is committed alongside the spec change and reviewed together — a migration without a matching spec update is not accepted.

## Naming
- Prisma's default timestamp-prefixed folder name is kept (e.g. `20260821120000_add_employee_status`).
- The `--name` suffix must describe the change in the same terms as the spec update that motivated it.

## Seeding
- Baseline data (an initial admin `User`, and baseline permission/role data once the permission model in `DB-USER` is decided) is seeded through `prisma/seed.ts`, run with `prisma db seed`.
- Seed data must not include real personal data; local/dev seed values are placeholders only.

## Rollback
- No down-migrations are relied upon. If a migration causes a problem, the fix is a new forward migration, not reverting the previous one — this avoids diverging schema history between environments that may already have applied the change.
- Destructive changes (dropping a column/table) require explicit user approval and must be called out in the work item that introduces them, per the Definition of Done.

## Environments
- Each environment (dev container, CI, staging, prod) has its own `DATABASE_URL`; migrations are never applied automatically against an environment other than local dev without an explicit deploy step.
- The local Docker Postgres service (`infra/docker-compose.yml`, see `TECH-INFRASTRUCTURE`) is the only environment where `prisma migrate dev` is expected to run directly against a container.

## Pending Decisions
- Whether a dedicated CI database/service is introduced for running migrations in automated tests.
- Backup-before-migrate policy for staging/production (not yet specified; production deployment is out of scope per `PROJECT-SCOPE`).
