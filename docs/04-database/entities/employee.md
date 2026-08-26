---
id: DB-EMPLOYEE
type: database
module: employee
status: draft
---

# Employee Entity

Department and delete-strategy decisions are resolved (see `WORK-000`): no Department relationship, hard delete.

## Purpose
Store the employee records managed through the Employee list/detail/create/update/delete workflows.

## Dependencies
- `BUSINESS-EMPLOYEE`
- `API-EMPLOYEE-CREATE`, `API-EMPLOYEE-DETAIL`, `API-EMPLOYEE-LIST`, `API-EMPLOYEE-UPDATE`, `API-EMPLOYEE-DELETE`
- `API-EMPLOYEE-BULK-CREATE`, `API-EMPLOYEE-BULK-UPDATE`, `API-EMPLOYEE-BULK-DELETE`, `API-EMPLOYEE-BY-IDS`
- `DB-CONVENTIONS`, `DB-USER`, `DB-ORGANIZATION`

## Requirements
- `employeeCode` and `email` must be enforceable as unique, matching the `EMPLOYEE_CODE_EXISTS` / `EMPLOYEE_EMAIL_EXISTS` error codes defined in the API specs.
- The record must support tracking who created/last updated it (for audit and detail-page display).
- No `departmentId` field exists (per `WORK-000` decision #1 — Department was removed from scope, not merely blocked).
- `status` uses the `EmployeeStatus` enum (per `WORK-000` decision #5 default).
- Delete is a hard delete (per `WORK-000` decision #3) — no `deletedAt` column.
- **Resolved (2026-08-26 daily task):** `Employee` gets an `organizationId` FK to `Organization` and a `userId` FK to `User`. Both are new, additive columns — no existing behavior changes.
  - `organizationId` is **nullable**. Existing employees have no organization assigned and the task's own migration rule ("must not lose data") rules out a forced backfill or a `NOT NULL` default that would require guessing an organization for every existing row. `ON DELETE SET NULL`, mirroring the existing `Organization.parentId` self-FK pattern — deleting an organization detaches its employees rather than blocking the delete or cascading employee deletion.
  - `userId` is **nullable and unique** (one employee maps to at most one login account), matching the task's own Prisma sketch (`userId String? @unique`). `null` means "no user account yet" (the employee has not accepted an invitation). Set only by the Invitation-accept flow (`DB-INVITATION`), never by Employee create/update. `ON DELETE SET NULL` — there is no user-delete endpoint in this phase, but if one is added later, detaching is safer than blocking or cascading into employee data.

## Design

### Table
`employees`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default generated | Primary identifier. |
| `employeeCode` | `varchar(50)` | unique, not null | |
| `firstName` | `varchar(100)` | not null | |
| `lastName` | `varchar(100)` | not null | |
| `email` | `varchar(255)` | unique, not null | Stored lowercased/trimmed. |
| `phone` | `varchar(30)` | nullable | |
| `position` | `varchar(100)` | nullable | Free text. |
| `status` | `EmployeeStatus` enum | not null, default `ACTIVE` | Values: `ACTIVE`, `INACTIVE`, `ON_LEAVE`, `TERMINATED`. |
| `organizationId` | `int4` | nullable, FK → `organizations.id`, `ON DELETE SET NULL` | New (2026-08-26). Matches `Organization.id`'s `int4` type (see `DB-ORGANIZATION`'s recorded PK deviation) — not a `uuid`. |
| `userId` | `uuid` | nullable, unique, FK → `users.id`, `ON DELETE SET NULL` | New (2026-08-26). Set by the Invitation-accept flow only. `null` = no login account yet. |
| `createdByUserId` | `uuid` | nullable, FK → `users.id` | |
| `updatedByUserId` | `uuid` | nullable, FK → `users.id` | |
| `createdAt` | `timestamptz` | not null, default `now()` | |
| `updatedAt` | `timestamptz` | not null, auto-updated | |

### Relationships
- `Employee N—1 User` via `createdByUserId` (nullable).
- `Employee N—1 User` via `updatedByUserId` (nullable).
- `Employee N—1 Organization` via `organizationId` (nullable, `ON DELETE SET NULL`). New (2026-08-26).
- `Employee 1—1 User` via `userId` (nullable, unique, `ON DELETE SET NULL`) — the employee's own login account, distinct from the `createdByUserId`/`updatedByUserId` audit actors. New (2026-08-26).
- `Employee 1—N Invitation` via `Invitation.employeeId` (see `DB-INVITATION`). New (2026-08-26).
- `Employee 1—N AuditLog` — polymorphic via `AuditLog.entityType = 'EMPLOYEE'` and `AuditLog.entityId = employees.id`, not a database FK.

## Validation
- `employeeCode`: required, unique, trimmed, max 50 chars.
- `firstName` / `lastName`: required, trimmed, max 100 chars.
- `email`: required, valid email format, unique, lowercased/trimmed, max 255 chars.
- `phone`: optional, max 30 chars, format not further validated.
- `status`: must be one of `EmployeeStatus`; defaults to `ACTIVE` on create if omitted.

## Test Notes
- Repository tests for `employeeCode`/`email` uniqueness conflicts.
- Hard-delete test: after `delete(id)`, the row no longer exists and a subsequent `findById` returns not-found.

## Ambiguities
None blocking. The following are documented defaults from `WORK-000`, adjustable later without structural change:
- Status enum values (`ACTIVE`/`INACTIVE`/`ON_LEAVE`/`TERMINATED`) are a default, not user-confirmed.
- Exact max lengths are a default, not user-confirmed.

New from the 2026-08-26 daily task, not blocking implementation but recorded for visibility:
- The daily task does not say whether `organizationId` should eventually become required. This spec keeps it nullable indefinitely; making it required later is a separate, explicit migration decision (would need a backfill strategy for existing rows).
- The bulk table editor (`FRONTEND-EMPLOYEE-CREATE`) becomes the primary way to set `organizationId` on create; the existing single-record `POST /api/employees` endpoint is kept for compatibility but does not require `organizationId` either.
