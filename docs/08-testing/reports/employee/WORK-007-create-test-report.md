# WORK-007 Test Report — Employee API: Create

## Feature
`POST /api/employees` (authenticated, `JwtAuthGuard` only — no permission check exists in this system). Validates and persists a new employee; enforces uniqueness on `employeeCode` and `email`; emits `EmployeeCreatedEvent` after a successful commit, consumed by the WORK-011 audit listener.

## Files Changed
- `backend/src/modules/employee/employee.module.ts`
- `backend/src/modules/employee/controller/employee.controller.ts` (`create` handler)
- `backend/src/modules/employee/service/employee.service.ts` (`create`, `ensureEmployeeCodeIsUnique`, `ensureEmailIsUnique`)
- `backend/src/modules/employee/repository/employee.repository.ts` (`create`, `findByEmployeeCode`, `findByEmail`)
- `backend/src/modules/employee/dto/create-employee.dto.ts`
- `backend/src/modules/employee/dto/employee-response.dto.ts`
- `backend/src/modules/employee/events/employee-created.event.ts`
- `backend/src/modules/employee/interfaces/{employee-service,employee-repository}.interface.ts`
- `backend/src/common/exceptions/app.exception.ts` (`EmployeeCodeExistsException`, `EmployeeEmailExistsException`)
- `backend/src/modules/employee/service/tests/employee.service.spec.ts` (`create` block)
- `backend/test/http/employee/create-employee.http`

## Commands Run
```
npm run test -- --verbose
node dist/src/main.js   # manual run, then curl against it
```

## Actual Result
- Unit tests: `EmployeeService > create` — 3/3 passed (success + emits `EmployeeCreatedEvent`; `EMPLOYEE_CODE_EXISTS` on duplicate code; `EMPLOYEE_EMAIL_EXISTS` on duplicate email).
- Manual HTTP verification (matches `test/http/employee/create-employee.http`):
  - Valid payload with an authenticated token → `201 {"success":true,"message":"Employee created successfully.","data":{...,"status":"ACTIVE",...}}`.
  - Same `employeeCode` again → `409 {"code":"EMPLOYEE_CODE_EXISTS","fieldErrors":{"employeeCode":[...]}}`.
  - Same `email` with a different code → `409 {"code":"EMPLOYEE_EMAIL_EXISTS",...}`.
  - Missing required fields → `400 {"code":"VALIDATION_ERROR",...}`.
  - No `Authorization` header → `401 {"code":"UNAUTHORIZED",...}`.
  - Confirmed via `docker exec employeeos-postgres psql ... "SELECT action, payload FROM audit_logs"` that a create produces exactly one `EMPLOYEE_CREATED` row with payload `{"employeeCode":"...","email":"..."}`.
- Full-suite numbers: `Test Suites: 6 passed, 6 total`, `Tests: 33 passed, 33 total`.

## Known Issues / Deviations
- **No `departmentId` field anywhere** (WORK-000 decision #1) — WORK-007's own spec text mentions a `departmentId` DTO field as a risk; that field does not exist in this implementation at all, by design.
- Field lengths (`employeeCode` 50, `firstName`/`lastName`/`position` 100, `email` 255, `phone` 30) enforced both at the DTO level (`class-validator` `@MaxLength`) and the DB level (Prisma `@db.VarChar`), per WORK-000 decision #8.
- No permission check of any kind on this route — only `JwtAuthGuard`, per WORK-000 decision #2.
