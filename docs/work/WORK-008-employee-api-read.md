---
id: WORK-008
type: workflow
module: employee
status: draft
depends_on:
  - API-EMPLOYEE-DETAIL
  - API-EMPLOYEE-LIST
  - DB-EMPLOYEE
---

# WORK-008: Employee API — Read (Detail + List)

## Work Status
`IMPLEMENTED`

## Summary
Implement the two read-only employee endpoints together, since neither has side effects, events, or audit requirements: `GET /api/employees/:id` (`API-EMPLOYEE-DETAIL`) and `GET /api/employees` (`API-EMPLOYEE-LIST`).

## Scope
In scope:
- `EmployeeController.findOne(id, currentUser)` → `EmployeeRepository.findById(id)`, `EMPLOYEE_NOT_FOUND` on miss.
- `EmployeeController.findAll(query, currentUser)` → `EmployeeRepository.findMany(queryOptions)` with pagination/search; `departmentId`/`status` filters stay disabled until `WORK-000` #1/#2 resolve.

Out of scope:
- Create/update/delete (`WORK-007`, `WORK-009`, `WORK-010`).
- Any audit logging (both specs explicitly say reads are not audited by default).

## Dependencies
- Specs: `API-EMPLOYEE-DETAIL`, `API-EMPLOYEE-LIST`, `DB-EMPLOYEE`.
- Work items: `WORK-002`, `WORK-005`, `WORK-007` (shares the `EmployeeModule`/`EmployeeRepository` scaffold created there — implement whichever of `WORK-007`/`WORK-008` lands first, then extend).

## Endpoint Design
| Endpoint | Method | Auth | Permission |
| --- | --- | --- | --- |
| `/api/employees/:id` | GET | required | `employee.read` |
| `/api/employees` | GET | required | `employee.read` |

## Validation
| Field | Rule |
| --- | --- |
| `id` (detail) | required, non-empty identifier |
| `page` / `limit` (list) | optional, positive integer; defaults not approved — pick a reasonable default (`page=1`, `limit=10`) and flag it as an assumption |
| `search` (list) | optional string |
| `departmentId` / `status` (list) | accepted by DTO but not enforced/filtered until `WORK-000` #1/#2 |
| `sortBy` / `sortOrder` (list) | optional; allowed fields not approved — restrict to `createdAt`/`employeeCode` as a safe default |

## Error Handling
| Code | Status | Mapping |
| --- | --- | --- |
| `EMPLOYEE_NOT_FOUND` | 404 | Detail endpoint, unknown id |
| `VALIDATION_ERROR` | 400 | Route param / query DTO failure |
| `FORBIDDEN` | 403 | Missing `employee.read` |

## Database Impact
- Tables/entities: `employees` (select only).
- Transactions: none.
- Audit log: none (explicitly not required for reads).
- Events: none.

## Test Plan
- Unit tests: `EmployeeService.findOne` (found/not-found), `EmployeeService.findAll` (pagination, search, empty result).
- HTTP tests: `test/http/employee/get-employee.http`, `get-employees.http`.
- Integration tests: seed a few employees, verify pagination/search against the real database.
- Report: `docs/08-testing/reports/employee/WORK-008-read-test-report.md`.

## Test Result
PASS. Unit tests: `EmployeeService > findOne` 2/2, `EmployeeService > findMany` 1/1. Manually verified get-by-id (found/not-found/invalid-UUID), and list with pagination, search, status filter, and sort against the running server. Full detail in `docs/08-testing/reports/employee/WORK-008-read-test-report.md`.

## Risks / Ambiguities
- Pagination defaults, sortable fields, and search scope are not approved; whatever default is picked must be documented in the test report as an assumption pending confirmation, per `API-EMPLOYEE-LIST` Ambiguities.
