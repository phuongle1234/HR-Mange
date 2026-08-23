# WORK-011 Test Report — Audit Log Listener

## Feature
`AuditLogListener` subscribes (via `@nestjs/event-emitter`'s `@OnEvent`) to `EmployeeCreatedEvent`, `EmployeeUpdatedEvent`, `EmployeeDeletedEvent` emitted by `EmployeeService` after each successful mutation, and writes one `AuditLog` row per event with the payload shapes from WORK-000 decision #9. A failed audit write is logged loudly via the shared winston-backed logger and never rolled back into (or allowed to fail) the original, already-committed employee mutation.

## Files Changed
- `backend/src/modules/audit-log/audit-log.module.ts`
- `backend/src/modules/audit-log/listener/audit-log.listener.ts`
- `backend/src/modules/audit-log/repository/audit-log.repository.ts`
- `backend/src/modules/audit-log/interfaces/audit-log-repository.interface.ts`
- `backend/src/common/constants/audit-action.constant.ts` (`AuditAction`, `AuditEntityType`)
- `backend/src/app.module.ts` (`EventEmitterModule.forRoot()`, `AuditLogModule` registration)
- `backend/src/modules/employee/events/{employee-created,employee-updated,employee-deleted}.event.ts` (event classes emitted by `EmployeeService`, consumed here)
- `backend/src/modules/audit-log/listener/tests/audit-log.listener.spec.ts`

## Commands Run
```
npm run test -- --verbose
node dist/src/main.js   # manual run, then curl against it + docker exec psql to inspect audit_logs
```

## Actual Result
- Unit tests: `AuditLogListener` — 4/4 passed (correct `EMPLOYEE_CREATED` payload `{employeeCode, email}`; correct `EMPLOYEE_UPDATED` payload `{changedFields}`; correct `EMPLOYEE_DELETED` payload `{employeeCode}`; a simulated repository failure is caught, logged via `logger.error`, and does NOT throw/propagate).
- End-to-end verification against the running API + Postgres (`docker exec employeeos-postgres psql -U postgres -d employee_management -c "SELECT action, entity_id, performed_by_user_id, payload FROM audit_logs ORDER BY created_at;"`):
  ```
        action      |              entity_id               |         performed_by_user_id         |                         payload
  ------------------+--------------------------------------+--------------------------------------+---------------------------------------------------------
   EMPLOYEE_CREATED | 6f5ef4bd-fd4f-4771-8b55-7d18a8f00c75 | 58bb1636-f675-45ea-a1bd-f4fcad3f66f7 | {"email": "ada@example.com", "employeeCode": "EMP-001"}
   EMPLOYEE_UPDATED | 6f5ef4bd-fd4f-4771-8b55-7d18a8f00c75 | 58bb1636-f675-45ea-a1bd-f4fcad3f66f7 | {"changedFields": ["position"]}
   EMPLOYEE_DELETED | 6f5ef4bd-fd4f-4771-8b55-7d18a8f00c75 | 58bb1636-f675-45ea-a1bd-f4fcad3f66f7 | {"employeeCode": "EMP-001"}
  ```
  One row per mutation, correct `action`, correct `entity_id`, correct `performed_by_user_id` (the acting JWT user), and payload shapes exactly matching WORK-000 decision #9. This exact scenario's rows were truncated afterward to leave the database in a clean seeded state for subsequent work.
- Full-suite numbers: `Test Suites: 6 passed, 6 total`, `Tests: 33 passed, 33 total`.

## Known Issues / Deviations
- **Event transport**: `docs/02-solution/event-driven.md` left the transport as an open "Pending Decision." Chose in-process `@nestjs/event-emitter` (single-process, synchronous-dispatch, no queue) per WORK-011's own instruction to name it here and treat that as the resolution. Flag for confirmation if a queue-backed/cross-process transport is later required.
- No retry policy exists for a failed audit write — per WORK-011's own instruction, none was invented; failures are logged loudly (`AuditLogListener` logger, `error` level, includes action + entityId, excludes any sensitive data) and otherwise dropped.
- Auth-event auditing (login/password-change) is explicitly out of scope for this phase (WORK-000 decision #9) and was not implemented.
