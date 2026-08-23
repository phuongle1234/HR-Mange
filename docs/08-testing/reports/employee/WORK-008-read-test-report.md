# WORK-008 Test Report — Employee API: Read (get one / list)

## Feature
`GET /api/employees/:id` and `GET /api/employees` (authenticated). List supports pagination (`page`/`limit`, default 1/10, max limit 100), case-insensitive `search` across `employeeCode`/`firstName`/`lastName`/`email`, `status` filter, and `sortBy`/`sortOrder` (fields: `employeeCode`, `createdAt`).

## Files Changed
- `backend/src/modules/employee/controller/employee.controller.ts` (`findOne`, `findMany` handlers)
- `backend/src/modules/employee/service/employee.service.ts` (`findOne`, `findMany`)
- `backend/src/modules/employee/repository/employee.repository.ts` (`findById`, `findMany`, `buildWhere`)
- `backend/src/modules/employee/dto/{employee-id-param,get-employees-query}.dto.ts`
- `backend/src/common/constants/app.constants.ts` (`DEFAULT_PAGE`, `DEFAULT_PAGE_LIMIT`, `MAX_PAGE_LIMIT`, `EMPLOYEE_SORTABLE_FIELDS`, `SORT_ORDERS`)
- `backend/src/common/exceptions/app.exception.ts` (`EmployeeNotFoundException`)
- `backend/src/modules/employee/service/tests/employee.service.spec.ts` (`findOne`, `findMany` blocks)
- `backend/test/http/employee/{get-employee,get-employees}.http`

## Commands Run
```
npm run test -- --verbose
node dist/src/main.js   # manual run, then curl against it
```

## Actual Result
- Unit tests: `EmployeeService > findOne` — 2/2 passed (found; `EMPLOYEE_NOT_FOUND`). `EmployeeService > findMany` — 1/1 passed (returns `{items, total}`).
- Manual HTTP verification (matches `test/http/employee/{get-employee,get-employees}.http`), run against two seeded employees (`EMP-100`, `EMP-101`):
  - `GET /api/employees/:id` for an existing id → `200` with the full employee object.
  - `GET /api/employees/00000000-0000-4000-8000-000000000000` → `404 {"code":"EMPLOYEE_NOT_FOUND",...}`.
  - `GET /api/employees/not-a-uuid` → `400 {"code":"VALIDATION_ERROR","fieldErrors":{"id":["id must be a valid UUID."]}}`.
  - `GET /api/employees?search=grace` → `200` with only the matching employee, `meta:{"page":1,"limit":10,"total":1}`.
  - `GET /api/employees?sortBy=employeeCode&sortOrder=asc` → `200`, `EMP-100` before `EMP-101`.
  - `GET /api/employees?sortBy=departmentId` (invalid field) → `400 {"code":"VALIDATION_ERROR","fieldErrors":{"sortBy":["sortBy must be one of employeeCode, createdAt."]}}`.
  - No `Authorization` header on either route → `401 UNAUTHORIZED`.
- Full-suite numbers: `Test Suites: 6 passed, 6 total`, `Tests: 33 passed, 33 total`.

## Known Issues / Deviations
- Pagination defaults (`page=1`, `limit=10`, max `limit=100`) and sortable-field set (`employeeCode`, `createdAt`) were not pinned down elsewhere in the spec beyond the API contract doc; implemented exactly as documented there. No `departmentId` filter exists (WORK-000 decision #1).
- No permission check on this route — `JwtAuthGuard` only.
