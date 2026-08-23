---
id: WORK-007
type: workflow
module: employee
status: draft
depends_on:
  - API-EMPLOYEE-CREATE
  - BUSINESS-EMPLOYEE
  - DB-EMPLOYEE
---

# WORK-007: Employee API — Create

## Work Status
`IMPLEMENTED`

## Summary
Implement `POST /api/employees` exactly as specified in `API-EMPLOYEE-CREATE`: `EmployeeController.create` → `IEmployeeService.create` → `EmployeeRepository.create`, emitting `EmployeeCreatedEvent` for `WORK-011`'s audit listener to consume.

## Scope
In scope:
- `EmployeeModule` skeleton: `EmployeeController`, `IEmployeeService`/`EmployeeService`, `EmployeeRepository`.
- `CreateEmployeeDto` with the field validation table from `API-EMPLOYEE-CREATE` (uniqueness checks for `employeeCode`/`email`; `departmentId` validation stays disabled/BLOCKED per that spec until Department is approved).
- `EmployeeCreatedEvent` emission with the documented payload (`employeeId`, `employeeCode`, `createdByUserId`, `createdAt`).

Out of scope:
- Get/list/update/delete (`WORK-008`–`WORK-010`).
- The audit log listener itself (`WORK-011`) — this item only emits the event.

## Dependencies
- Specs: `API-EMPLOYEE-CREATE`, `BUSINESS-EMPLOYEE`, `DB-EMPLOYEE`.
- Work items: `WORK-002`, `WORK-005`.

## Endpoint Design
| Endpoint | Method | Auth | Permission |
| --- | --- | --- | --- |
| `/api/employees` | POST | required | `employee.create` |

## Validation
| Field | Rule |
| --- | --- |
| `employeeCode` | required, unique, trimmed |
| `firstName` / `lastName` | required, trimmed |
| `email` | required, valid format, trimmed, lowercase, unique |
| `phone` | optional |
| `departmentId` | required by DTO shape but validation stays disabled — BLOCKED until Department is approved |
| `position` | optional |
| `status` | optional, no enum enforced until approved |

## Error Handling
| Code | Status | Mapping |
| --- | --- | --- |
| `EMPLOYEE_CODE_EXISTS` | 409 | Duplicate `employeeCode` |
| `EMPLOYEE_EMAIL_EXISTS` | 409 | Duplicate `email` |
| `DEPARTMENT_NOT_DEFINED` | 400 | Department spec/relationship not approved |
| `VALIDATION_ERROR` | 400 | DTO validation failure |
| `FORBIDDEN` | 403 | Missing `employee.create` |

## Database Impact
- Tables/entities: `employees` (insert), `createdByUserId` set from the authenticated user.
- Transactions: single insert, no multi-table transaction needed yet.
- Audit log: `EMPLOYEE_CREATED`, via the event listener built in `WORK-011`.
- Events: `EmployeeCreatedEvent`.

## Test Plan
- Unit tests: `EmployeeService.create` (success, duplicate code, duplicate email).
- HTTP tests: `test/http/employee/create.http`.
- Integration tests: create against the real database, verify the row and the emitted event.
- Report: `docs/08-testing/reports/employee/WORK-007-create-test-report.md`.

## Test Result
PASS. Unit tests: `EmployeeService > create` 3/3 (success + event emission; duplicate code; duplicate email). Manually verified against the running server, including the resulting `EMPLOYEE_CREATED` audit log row. No `departmentId` field exists anywhere (WORK-000 decision #1 fully applied, superseding this file's earlier draft DTO). Full detail in `docs/08-testing/reports/employee/WORK-007-create-test-report.md`.

## Risks / Ambiguities
- `departmentId` is accepted by the DTO shape but cannot be truly validated/persisted as a relation while Department stays blocked; the field is stored as a bare nullable UUID column with no FK, per `DB-EMPLOYEE`.
- Exact max lengths are not approved; the drafted defaults from `DB-EMPLOYEE` are used and must be called out as assumptions in the test report.
