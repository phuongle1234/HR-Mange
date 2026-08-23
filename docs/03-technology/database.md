---
id: TECH-DATABASE
type: technology
module: global
status: draft
---

# Database

## Purpose
Define database technology requirements.

## Stack
- Database: PostgreSQL.
- ORM: Prisma.
- Migrations: Prisma migrations when database implementation is approved.

## Rules
- Database design must be specified before Prisma schema and migration.
- Do not add fields without database spec.
- Every database change must update database spec.
- No Department table (removed from scope, `WORK-000` decision #1).
- Delete strategy is hard delete (`WORK-000` decision #3).

## Expected Entities
- User (no role/permission fields — `WORK-000` decision #2).
- Employee (no `departmentId`, no `deletedAt`).
- Audit Log.
- No Permission/Role table. No Password reset token table (forgot-password reset delivery is not implemented in this phase).

## Security
- Password hashes may be stored; plaintext passwords must never be stored.
- Reset tokens must be hashed or otherwise protected if implemented.
- Sensitive fields must not be selected or returned unnecessarily.

## Pending Decisions
None blocking — resolved in `WORK-000`. Audit log payload shape is a documented default, not separately user-confirmed.
