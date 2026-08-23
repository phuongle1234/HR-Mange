---
id: WORK-000
type: workflow
module: global
status: draft
depends_on:
  - PROJECT-SCOPE
  - DB-USER
  - DB-EMPLOYEE
  - DB-AUDIT-LOG
  - API-AUTHENTICATION
---

# WORK-000: Resolve Pending Architecture Decisions

## Work Status
`DONE` — the user resolved the four architecture-shaping decisions below. The five remaining lower-risk decisions were assigned a documented default (not a user-confirmed final answer) so downstream work items are not blocked; those defaults can still be revisited without a schema-breaking change.

## Summary
Every downstream backend/frontend work item was gated by a small set of decisions. The four structural ones are now resolved by the user; the five easily-reversible ones were defaulted so implementation could proceed.

## Decisions — Resolved By User
| # | Decision | Resolution |
| --- | --- | --- |
| 1 | Department entity/relationship | **Removed.** `Employee` has no `departmentId` field at all for this phase. No `departments` table. Can be reintroduced later as its own work item if needed. |
| 2 | Permission/role model | **Removed.** No role column, no permission table. Any authenticated user can perform every Employee operation (list/detail/create/update/delete) and every auth-required operation. Backend still requires a valid session for every protected endpoint — only the fine-grained permission check is gone. |
| 3 | Delete strategy | **Hard delete.** `DELETE /api/employees/:id` permanently removes the row. No `deletedAt` column. |
| 4 | Auth token transport | **Bearer token in response body.** `POST /api/auth/login` returns the access token in the JSON body; the frontend stores it (in memory/Redux, persisted to `localStorage` for page-reload continuity) and sends it via the `Authorization: Bearer <token>` header. No auth cookie. |

## Decisions — Defaulted (Documented, Not User-Confirmed, Low Risk To Change Later)
| # | Decision | Default Applied |
| --- | --- | --- |
| 5 | Employee status enum values | `ACTIVE`, `INACTIVE`, `ON_LEAVE`, `TERMINATED`, stored as a Prisma enum `EmployeeStatus`. |
| 6 | Password policy | Minimum 8 characters, at least one letter and one number. |
| 7 | Password hashing library | `bcrypt` (via `bcryptjs` or `bcrypt` npm package). |
| 8 | Employee field max lengths | `employeeCode varchar(50)`, `firstName`/`lastName`/`position` `varchar(100)`, `email varchar(255)`, `phone varchar(30)`. |
| 9 | Audit log payload shape | `EMPLOYEE_CREATED`: `{ employeeCode, email }`. `EMPLOYEE_UPDATED`: `{ changedFields: string[] }`. `EMPLOYEE_DELETED`: `{ employeeCode }`. Auth events (`LOGIN_SUCCEEDED`, `PASSWORD_CHANGED`, etc.) are deferred — not implemented in this phase, only the Employee lifecycle events are audited. |

## Impact — Specs Updated As A Result
- `docs/00-project/scope.md`, `docs/01-business/modules/employee/business-rules.md`
- `docs/04-database/entities/{employee,user}.md`, `relationships.md`, `indexes.md`
- `docs/06-api/employee/{create,get-employee,get-employees,update,delete}-employee.md`, `authentication.md`, `authorization.md`
- `docs/02-solution/authorization.md`
- `docs/07-frontend/authorization.md`, `providers/auth-provider.md`, `react-route.md`, `api-client.md`, `architecture.md`, `pages/{login,employee-list,employee-detail,employee-create,employee-edit}.md`
- `docs/work/backlog.md` and every `WORK-0NN` item that referenced Department/permission/delete-strategy ambiguity.

## Test Plan / Test Result
Not applicable — decision-recording only.

## Risks / Ambiguities
- The five defaulted items (#5–#9) are documented assumptions, not explicit user sign-off. If the user objects to any of them later, only that item needs revisiting — none of them are structural (no migration-breaking change required to adjust an enum's values, a hashing library, or a string column's length).
- Removing permission checks entirely means any authenticated user has full access. If the user later wants tiered access, that is a new, separate work item (re-adding a role/permission model), not a patch to this one.
