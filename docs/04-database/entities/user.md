---
id: DB-USER
type: database
module: user
status: draft
---

# User Entity

No role/permission model (see `WORK-000` decision #2): any authenticated user has full access. This entity only needs to support login and identification as an actor.

## Purpose
Store authenticated user accounts used for login, and as the actor recorded on `Employee` and `AuditLog` rows.

## Dependencies
- `BUSINESS-OVERVIEW`, `SOLUTION-AUTHENTICATION`
- `API-AUTHENTICATION`
- `DB-CONVENTIONS`

## Requirements
- A user must be identifiable by a unique email for login (`POST /api/auth/login`).
- A user's password must never be stored or returned as plaintext.
- A user must be resolvable as the actor for audit log entries and for `Employee.createdByUserId` / `updatedByUserId`.
- Deactivated users must be preventable from logging in (`isActive`), independent of deleting the row.

## Design

### Table
`users`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default generated | Primary identifier. |
| `email` | `varchar(255)` | unique, not null | Login identifier, stored lowercased/trimmed. |
| `passwordHash` | `varchar(255)` | not null | `bcrypt` hash (per `WORK-000` decision #7 default). Never selected/returned/logged. |
| `fullName` | `varchar(255)` | not null | Display name shown in UI (e.g. audit log actor). |
| `isActive` | `boolean` | not null, default `true` | `false` blocks login. |
| `lastLoginAt` | `timestamptz` | nullable | Set on successful login. |
| `createdAt` | `timestamptz` | not null, default `now()` | |
| `updatedAt` | `timestamptz` | not null, auto-updated | |

### Relationships
- `User 1—N AuditLog` via `AuditLog.performedByUserId`.
- `User 1—N Employee` via `Employee.createdByUserId` (nullable).
- `User 1—N Employee` via `Employee.updatedByUserId` (nullable).

There is no role or permission column and no `permissions`/`user_permissions` table — authorization for this phase is "authenticated or not," nothing finer-grained.

## Validation
- `email`: required, valid email format, unique at the database level.
- `passwordHash`: required, never validated/compared directly — comparison happens through `bcrypt.compare`, not raw string equality.
- `fullName`: required, trimmed.
- `password` (write-only, not a column): minimum 8 characters, at least one letter and one number (per `WORK-000` decision #6 default).

## Test Notes
- Repository unit tests for the uniqueness-violation path (Prisma `P2002` mapped to an application error), and for `isActive = false` blocking authentication.

## Ambiguities
None blocking. Password policy and hashing library (`WORK-000` decisions #6/#7) are documented defaults, not user-confirmed, and can be swapped later without a schema change beyond re-hashing.
