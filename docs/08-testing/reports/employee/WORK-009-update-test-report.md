# WORK-009 Test Report — Employee API: Update

## Feature
`PUT /api/employees/:id` (authenticated), partial update of any subset of employee fields. Re-checks `employeeCode`/`email` uniqueness excluding the current row. Computes the list of actually-changed field names and emits `EmployeeUpdatedEvent` (only when something changed) after a successful commit, consumed by the WORK-011 audit listener.

## Files Changed
- `backend/src/modules/employee/controller/employee.controller.ts` (`update` handler)
- `backend/src/modules/employee/service/employee.service.ts` (`update`, `computeChangedFields`)
- `backend/src/modules/employee/repository/employee.repository.ts` (`update`)
- `backend/src/modules/employee/dto/update-employee.dto.ts`
- `backend/src/modules/employee/events/employee-updated.event.ts`
- `backend/src/modules/employee/service/tests/employee.service.spec.ts` (`update` block)
- `backend/test/http/employee/update-employee.http`

## Commands Run
```
npm run test -- --verbose
node dist/src/main.js   # manual run, then curl against it
```

## Actual Result
- Unit tests: `EmployeeService > update` — 4/4 passed (success + emits event with correct `changedFields`; `EMPLOYEE_NOT_FOUND`; `EMPLOYEE_CODE_EXISTS` when renaming to a code used by another row; no event emitted when nothing changed).
- Manual HTTP verification (matches `test/http/employee/update-employee.http`):
  - Partial update (`position`, `status`) with a valid token → `200` with the merged employee object.
  - Update on a non-existent id → `404 {"code":"EMPLOYEE_NOT_FOUND",...}`.
  - Setting `employeeCode` to a value already used by a different employee → `409 {"code":"EMPLOYEE_CODE_EXISTS",...}`.
  - Setting `status` to a value outside the enum (`"RETIRED"`) → `400 {"code":"VALIDATION_ERROR","fieldErrors":{"status":[...]}}`.
  - No `Authorization` header → `401 UNAUTHORIZED`.
  - Confirmed via `docker exec employeeos-postgres psql ... "SELECT action, payload FROM audit_logs"` that a single-field update (`position`) produces one `EMPLOYEE_UPDATED` row with payload `{"changedFields":["position"]}`.
- Full-suite numbers: `Test Suites: 6 passed, 6 total`, `Tests: 33 passed, 33 total`.

## Known Issues / Deviations
- The audit payload stores only changed-field *names*, never old/new values, per WORK-000 decision #9 (`{ changedFields: string[] }`) — resolves the ambiguity flagged in WORK-009's own spec text.
- Route uses the exact HTTP verb specified in `docs/06-api/employee/update-employee.md` (`PUT`, full-resource-replace semantics at the transport level even though the DTO fields are all optional) rather than `PATCH`.
- No permission check on this route — `JwtAuthGuard` only.
