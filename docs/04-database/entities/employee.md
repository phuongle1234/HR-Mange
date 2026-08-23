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
- `DB-CONVENTIONS`, `DB-USER`

## Requirements
- `employeeCode` and `email` must be enforceable as unique, matching the `EMPLOYEE_CODE_EXISTS` / `EMPLOYEE_EMAIL_EXISTS` error codes defined in the API specs.
- The record must support tracking who created/last updated it (for audit and detail-page display).
- No `departmentId` field exists (per `WORK-000` decision #1 — Department was removed from scope, not merely blocked).
- `status` uses the `EmployeeStatus` enum (per `WORK-000` decision #5 default).
- Delete is a hard delete (per `WORK-000` decision #3) — no `deletedAt` column.

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
| `createdByUserId` | `uuid` | nullable, FK → `users.id` | |
| `updatedByUserId` | `uuid` | nullable, FK → `users.id` | |
| `createdAt` | `timestamptz` | not null, default `now()` | |
| `updatedAt` | `timestamptz` | not null, auto-updated | |

### Relationships
- `Employee N—1 User` via `createdByUserId` (nullable).
- `Employee N—1 User` via `updatedByUserId` (nullable).
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
