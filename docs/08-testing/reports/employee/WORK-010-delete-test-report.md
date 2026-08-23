# WORK-010 Test Report — Employee API: Delete

## Feature
`DELETE /api/employees/:id` (authenticated). Hard delete — permanently removes the row (WORK-000 decision #3; no `deletedAt` column anywhere). Captures the employee's `employeeCode` before deleting it, then emits `EmployeeDeletedEvent` after a successful commit, consumed by the WORK-011 audit listener.

## Files Changed
- `backend/src/modules/employee/controller/employee.controller.ts` (`delete` handler)
- `backend/src/modules/employee/service/employee.service.ts` (`delete`)
- `backend/src/modules/employee/repository/employee.repository.ts` (`delete`)
- `backend/src/modules/employee/events/employee-deleted.event.ts`
- `backend/src/modules/employee/service/tests/employee.service.spec.ts` (`delete` block)
- `backend/test/http/employee/delete-employee.http`

## Commands Run
```
npm run test -- --verbose
node dist/src/main.js   # manual run, then curl against it
```

## Actual Result
- Unit tests: `EmployeeService > delete` — 2/2 passed (success + emits `EmployeeDeletedEvent` with the pre-delete `employeeCode`; `EMPLOYEE_NOT_FOUND` when the row doesn't exist, and the repository's `delete` is confirmed NOT called in that case).
- Manual HTTP verification (matches `test/http/employee/delete-employee.http`):
  - `DELETE /api/employees/:id` on an existing employee → `200 {"success":true,"message":"Employee deleted successfully.","data":null,"meta":null}`.
  - Immediately deleting the same id again → `404 {"code":"EMPLOYEE_NOT_FOUND",...}`, confirming the row is actually gone (hard delete, not a soft-delete flag).
  - `DELETE /api/employees/not-a-uuid` → `400 {"code":"VALIDATION_ERROR",...}`.
  - No `Authorization` header → `401 UNAUTHORIZED`.
  - Confirmed via `docker exec employeeos-postgres psql ... "SELECT action, payload FROM audit_logs"` that the delete produced exactly one `EMPLOYEE_DELETED` row with payload `{"employeeCode":"..."}`, and that the employee row itself no longer exists in `employees`.
- Full-suite numbers: `Test Suites: 6 passed, 6 total`, `Tests: 33 passed, 33 total`.

## Known Issues / Deviations
- WORK-010's own spec text describes a `DELETE_STRATEGY_NOT_APPROVED` error path for the (then-unresolved) soft-vs-hard-delete question; that question is resolved by WORK-000 decision #3 (hard delete), so that error code does not exist in this implementation — `DELETE` always either succeeds (`200`) or returns `EMPLOYEE_NOT_FOUND`/`VALIDATION_ERROR`/`UNAUTHORIZED`.
- No permission check on this route — `JwtAuthGuard` only.
- Whether related records block a delete is not applicable in this phase (no other entity references `Employee`).
