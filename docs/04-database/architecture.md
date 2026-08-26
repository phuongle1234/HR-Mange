---
id: DB-ARCHITECTURE
type: database
module: global
status: draft
---

# Architecture

Draft database specification. No Prisma schema or migration is created in this phase.

## Purpose
Define the overall database technology approach and how entities are organized before Prisma schema/migration work begins.

## Database Overview
- Engine: PostgreSQL (see `TECH-DATABASE`).
- ORM/migration tool: Prisma.
- One schema per environment (`public`), one database per environment (dev/staging/prod), connection string via `DATABASE_URL`.
- Prisma Client is generated at build time from `prisma/schema.prisma`; the schema file itself is only created once this spec and each entity spec (`DB-USER`, `DB-EMPLOYEE`, `DB-AUDIT-LOG`) are approved.

## Entity Groups
| Group | Entities | Status |
| --- | --- | --- |
| Identity | `User` | Draft (`DB-USER`) |
| Domain | `Employee`, `Department` (future) | Draft / blocked (`DB-EMPLOYEE`) |
| Domain | `Organization`, `OrganizationType` | Draft (`DB-ORGANIZATION`, `DB-ORGANIZATION-TYPE`) — added after this table was last updated; listed here now for accuracy. |
| Domain | `Invitation` | Draft, new (`DB-INVITATION`, 2026-08-26). |
| Audit | `AuditLog` | Draft (`DB-AUDIT-LOG`) |
| Auth support | `PasswordResetToken` (if forgot-password reset is approved) | Not yet specified |

## Connection & Environment
- Backend reads `DATABASE_URL` (see `.env.example`) and passes it to Prisma Client; no other part of the codebase should read database credentials directly.
- Local development connects to the `postgres` service defined in `infra/docker-compose.yml` (see `TECH-INFRASTRUCTURE`).
- A test environment, if introduced, must use a separate database name; sharing the dev database with automated tests is not approved.

## Pending Decisions
- Whether Department becomes its own table or a reference to an external system (blocked, see `DB-EMPLOYEE`).
- Whether a dedicated test database/container is introduced.
- Multi-schema or multi-tenant separation (not currently planned).
