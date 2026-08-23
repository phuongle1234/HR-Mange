---
id: WORK-009
type: workflow
module: employee
status: draft
depends_on:
  - API-EMPLOYEE-UPDATE
  - DB-EMPLOYEE
---

# WORK-009: Employee API — Update

## Work Status
`IMPLEMENTED`

## Summary
Implement `PUT /api/employees/:id` per `API-EMPLOYEE-UPDATE`: partial-field update, uniqueness checks excluding the current row, and an `EmployeeUpdatedEvent` for `WORK-011`.

## Scope
In scope:
- `EmployeeController.update(id, dto, currentUser)` → `IEmployeeService.update` → `EmployeeRepository.update(id, data)`.
- `UpdateEmployeeDto` — every field optional; `employeeCode`/`email` uniqueness checks exclude the current record.
- `EmployeeUpdatedEvent` with `employeeId`, `changedFields`, `updatedByUserId`, `updatedAt`.

Out of scope:
- Create/read/delete (`WORK-007`, `WORK-008`, `WORK-010`).

## Dependencies
- Specs: `API-EMPLOYEE-UPDATE`, `DB-EMPLOYEE`.
- Work items: `WORK-007`.

## Endpoint Design
| Endpoint | Method | Auth | Permission |
| --- | --- | --- | --- |
| `/api/employees/:id` | PUT | required | `employee.update` |

## Validation
| Field | Rule |
| --- | --- |
| `id` | required |
| `employeeCode` | optional, unique excluding current record |
| `firstName` / `lastName` | optional, non-empty when provided |
| `email` | optional, valid format, unique excluding current record |
| `phone` / `position` | optional |
| `departmentId` | accepted by DTO shape, validation BLOCKED until Department is approved |
| `status` | optional, no enum enforced until approved |

## Error Handling
| Code | Status | Mapping |
| --- | --- | --- |
| `EMPLOYEE_NOT_FOUND` | 404 | Unknown id |
| `EMPLOYEE_CODE_EXISTS` / `EMPLOYEE_EMAIL_EXISTS` | 409 | Conflict with another record |
| `DEPARTMENT_NOT_DEFINED` | 400 | Department not approved |
| `VALIDATION_ERROR` | 400 | DTO failure |
| `FORBIDDEN` | 403 | Missing `employee.update` |

## Database Impact
- Tables/entities: `employees` (update), `updatedByUserId` set from the authenticated user.
- Transactions: single update.
- Audit log: `EMPLOYEE_UPDATED`, via `WORK-011`'s listener, including changed-field names (old/new value detail is unapproved per `API-EMPLOYEE-UPDATE` Ambiguities).
- Events: `EmployeeUpdatedEvent`.

## Test Plan
- Unit tests: successful partial update, duplicate-code/email conflict, not-found.
- HTTP tests: `test/http/employee/update.http`.
- Integration tests: update against the real database, verify only provided fields changed.
- Report: `docs/08-testing/reports/employee/WORK-009-update-test-report.md`.

## Test Result
PASS. Unit tests: `EmployeeService > update` 4/4 (success + changed-field event; not found; code conflict; no event when nothing changed). Manually verified against the running server, including the resulting `EMPLOYEE_UPDATED` audit log row with `{"changedFields":[...]}` only (no old/new values — resolves this file's own open ambiguity per WORK-000 decision #9). Full detail in `docs/08-testing/reports/employee/WORK-009-update-test-report.md`.

## Risks / Ambiguities
- Whether the audit payload stores old values is unapproved; ship with changed-field names only until confirmed otherwise.
