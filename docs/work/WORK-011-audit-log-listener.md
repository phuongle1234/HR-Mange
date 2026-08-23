---
id: WORK-011
type: workflow
module: audit-log
status: draft
depends_on:
  - DB-AUDIT-LOG
  - SOLUTION-EVENT-DRIVEN
---

# WORK-011: Audit Log Event Listener

## Work Status
`IMPLEMENTED`

## Summary
Build the single event listener that every "Audit Log Behavior" section across the API specs points at: it consumes `EmployeeCreatedEvent`, `EmployeeUpdatedEvent`, `EmployeeDeletedEvent` (and, if emitted, the auth events from `WORK-005`/`WORK-006`) and writes one `audit_logs` row per event, keeping the write out of every controller/service per `SOLUTION-EVENT-DRIVEN`.

## Scope
In scope:
- One `AuditLogListener` (exact class name per `API-EMPLOYEE-CREATE` etc., "pending implementation spec" — name it here and treat that as the resolution) subscribing to the employee lifecycle events.
- Mapping each event to an `AuditLog` row: `action`, `entityType: 'EMPLOYEE'`, `entityId`, `performedByUserId`, `payload`, `createdAt`.
- Ensuring the payload never contains secrets/PII beyond what's needed (`AGENTS.md`).

Out of scope:
- Any UI for browsing audit logs — not specified anywhere yet.
- Auth-event auditing, unless `WORK-005`/`WORK-006` already emit those events by the time this item starts (see the note in both of those items about deferring emission).

## Dependencies
- Specs: `DB-AUDIT-LOG`, `SOLUTION-EVENT-DRIVEN`.
- Work items: `WORK-007`, `WORK-009`, `WORK-010` (event producers), `WORK-000` #9 (payload shape).

## Database Impact
- Tables/entities: `audit_logs` (insert only, append-only per `DB-AUDIT-LOG`).
- Transactions: each listener invocation writes exactly one row; if the write fails, the triggering operation has already committed (events fire after success), so a failed audit write must be logged loudly (not swallowed) rather than rolled back into the original operation.
- Events consumed: `EmployeeCreatedEvent`, `EmployeeUpdatedEvent`, `EmployeeDeletedEvent`.

## Test Plan
- Unit tests: listener maps each event type to the correct `action`/`payload` shape.
- Integration tests: trigger `WORK-007`'s create endpoint end-to-end and assert exactly one `audit_logs` row with `action = 'EMPLOYEE_CREATED'` appears; repeat for update/delete.
- Report: `docs/08-testing/reports/audit-log/WORK-011-listener-test-report.md`.

## Test Result
PASS. Unit tests: `AuditLogListener` 4/4 (correct payload per event type; a simulated write failure is caught and logged, never thrown). End-to-end verified against the running server + Postgres: create/update/delete of one employee produced exactly one `EMPLOYEE_CREATED`/`EMPLOYEE_UPDATED`/`EMPLOYEE_DELETED` row each, with the exact payload shapes from WORK-000 decision #9. Event transport chosen: in-process `@nestjs/event-emitter` (documented as the resolution of this file's own "name it here" instruction). Full detail in `docs/08-testing/reports/audit-log/WORK-011-listener-test-report.md`.

## Risks / Ambiguities
- Exact `payload` contents per action are not approved (`DB-AUDIT-LOG` Ambiguities) — ship with the documented candidate fields (e.g. changed-field names for updates) and flag as pending confirmation.
- If an audit write fails, current specs do not define retry behavior (`WORKFLOW-SPEC-INITIALIZATION-REPORT` lists "event retry behavior" as pending) — log and surface the failure rather than inventing a retry policy.
