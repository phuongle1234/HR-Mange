---
id: WORK-010
type: workflow
module: employee
status: draft
depends_on:
  - API-EMPLOYEE-DELETE
  - DB-EMPLOYEE
  - BUSINESS-EMPLOYEE
---

# WORK-010: Employee API — Delete

## Work Status
`IMPLEMENTED`

## Summary
Implement `DELETE /api/employees/:id` per `API-EMPLOYEE-DELETE`, calling either `EmployeeRepository.delete(id)` (hard) or `EmployeeRepository.softDelete(id)` (soft) once `WORK-000` #3 picks one, and emitting `EmployeeDeletedEvent`.

## Scope
In scope:
- `EmployeeController.delete(id, currentUser)` → `IEmployeeService.delete` → the repository function matching the approved delete strategy.
- `EmployeeDeletedEvent` with `employeeId`, `deletedByUserId`, `deletedAt`, `deleteStrategy`.

Out of scope:
- Create/read/update (`WORK-007`–`WORK-009`).
- Cascade behavior for related records referencing a deleted employee — not specified anywhere yet; if it comes up, record it as a new ambiguity rather than inventing a rule.

## Dependencies
- Specs: `API-EMPLOYEE-DELETE`, `DB-EMPLOYEE`, `BUSINESS-EMPLOYEE`.
- Work items: `WORK-007`, `WORK-000` (#3 is a hard blocker, not a soft one — the endpoint's happy path literally does not exist until this is decided).

## Endpoint Design
| Endpoint | Method | Auth | Permission |
| --- | --- | --- | --- |
| `/api/employees/:id` | DELETE | required | `employee.delete` |

## Validation
| Field | Rule |
| --- | --- |
| `id` | required, must reference an existing employee |

## Error Handling
| Code | Status | Mapping |
| --- | --- | --- |
| `EMPLOYEE_NOT_FOUND` | 404 | Unknown id |
| `DELETE_STRATEGY_NOT_APPROVED` | 400 | Returned by every call until `WORK-000` #3 is resolved |
| `VALIDATION_ERROR` | 400 | Route param failure |
| `FORBIDDEN` | 403 | Missing `employee.delete` |

## Database Impact
- Tables/entities: `employees` (hard delete row, or set `deletedAt` for soft delete — exact column per `WORK-000` #3).
- Transactions: single delete/update.
- Audit log: `EMPLOYEE_DELETED`, via `WORK-011`'s listener.
- Events: `EmployeeDeletedEvent`.

## Test Plan
- Unit tests: successful delete (per approved strategy), not-found, permission denial.
- HTTP tests: `test/http/employee/delete.http`.
- Integration tests: delete against the real database, verify the row is gone (hard) or `deletedAt` is set and excluded from reads (soft).
- Report: `docs/08-testing/reports/employee/WORK-010-delete-test-report.md`.

## Test Result
PASS. Unit tests: `EmployeeService > delete` 2/2 (success + event with pre-delete code; not found, repository delete confirmed not called). Manually verified hard delete against the running server: deleting twice returns `200` then `404 EMPLOYEE_NOT_FOUND`, confirming the row is truly gone (no `deletedAt`). `DELETE_STRATEGY_NOT_APPROVED` no longer applies — WORK-000 decision #3 resolved hard delete. Full detail in `docs/08-testing/reports/employee/WORK-010-delete-test-report.md`.

## Risks / Ambiguities
- Whether related records (future) block delete is unapproved (`API-EMPLOYEE-DELETE` Ambiguities).
