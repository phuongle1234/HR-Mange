---
id: DB-AUDIT-LOG
type: database
module: audit-log
status: draft
---

# Audit Log Entity

Draft entity skeleton for important action records. Retention and payload shape require approval.

## Purpose
Record important actions (employee create/update/delete, authentication events) for traceability, driven by the event-based audit behavior described in the solution/event-driven spec and the per-API "Audit Log Behavior" sections (e.g. `API-EMPLOYEE-CREATE`).

## Dependencies
- `SOLUTION-EVENT-DRIVEN`, `SOLUTION-LOGGING`
- `API-EMPLOYEE-CREATE`, `API-EMPLOYEE-UPDATE`, `API-EMPLOYEE-DELETE`
- `DB-CONVENTIONS`, `DB-USER`

## Requirements
- Every audit-required action must be able to record: what happened, on which record, by whom, and when.
- The payload must not contain secrets or unnecessary sensitive values, matching the "do not log" rule in `AGENTS.md`.
- The mechanism is event-driven: an event listener creates the audit log row after the triggering operation succeeds, not the controller/service directly (see `API-EMPLOYEE-CREATE` Event Behavior).

## Design

### Table
`audit_logs`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default generated | |
| `action` | `varchar(50)` | not null | Reserved as a plain string, not a Prisma enum, until the action list is finalized (see Ambiguities). |
| `entityType` | `varchar(50)` | not null | e.g. `EMPLOYEE`, `USER`. Identifies which entity `entityId` belongs to. |
| `entityId` | `uuid` | not null | The affected row's `id`. No FK constraint — see `DB-RELATIONSHIPS`. |
| `performedByUserId` | `uuid` | nullable, FK → `users.id` | Nullable to allow system-triggered actions with no human actor. |
| `payload` | `jsonb` | nullable | Structured details of the change (e.g. changed fields); exact shape per action is not approved. |
| `createdAt` | `timestamptz` | not null, default `now()` | Immutable; audit rows are never updated. |

Note: there is intentionally no `updatedAt` — audit rows are append-only.

### Relationships
- `AuditLog N—1 User` via `performedByUserId` (nullable).
- `AuditLog` relates to its subject entity only through `entityType` + `entityId` (polymorphic, no FK).

### Candidate Action Values (Proposed, Not Approved)
`EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `EMPLOYEE_DELETED`, `LOGIN_SUCCEEDED`, `LOGIN_FAILED`, `PASSWORD_CHANGED`, `PASSWORD_RESET_REQUESTED`.

## Validation
- `action`, `entityType`: required, must come from an approved fixed set once one is defined — not free text in the final implementation.
- `entityId`: required, must reference an existing row of the type named by `entityType` at write time (checked in application code, not a DB constraint).
- `payload`: must be checked at the point of construction (in the event listener) to exclude secrets/PII beyond what the audit requirement needs.

## Test Notes
- Once implemented: tests that a triggering action always results in exactly one audit row, and that no audit row is written if the triggering operation fails (no partial audit on rollback).
- No tests exist yet; this entity has no Prisma schema or migration.

## Ambiguities
- Final `action` value set and whether it becomes a Prisma enum or stays a string.
- Exact `payload` shape per action (e.g. does `EMPLOYEE_UPDATED` store a full before/after diff, or only changed field names?).
- Retention policy — the daily application log rule (10-day retention) is explicitly about log files, not this table; whether `audit_logs` has any retention/archival policy is undecided.
- Whether reads (e.g. `GET /api/employees`) are ever audited — current assumption is no, pending approval.
