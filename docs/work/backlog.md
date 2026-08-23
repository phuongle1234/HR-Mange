---
id: WORK-BACKLOG
type: workflow
module: global
status: draft
---

# Work Backlog

## Purpose
Break the Employee Management System into scoped work items, in dependency order, so implementation proceeds one approved item at a time per `WORKFLOW-DEVELOPMENT-FLOW` and `WORKFLOW-AI-CODING-FLOW`.

## WORK-000 Resolution (locks in the shape of everything below)
- Department: **removed from scope** — `Employee` has no `departmentId`.
- Permission/role model: **removed** — any authenticated user can do everything; no `employee.read`/`create`/`update`/`delete` permission checks anywhere.
- Delete strategy: **hard delete**.
- Auth transport: **Bearer token** in the login response body, sent via `Authorization` header — no auth cookie.
- Five lower-risk items (status enum values, password policy, hashing library, field max lengths, audit payload shape) were assigned documented defaults — see `WORK-000` file for the full table.

## Dependency Graph
```text
WORK-000 (DONE)
    |
    +---------------------------+
    v                           v
WORK-001 (backend scaffold)  WORK-003 (frontend scaffold)
    |                           |
    v                           v
WORK-002 (database schema)   WORK-004 (docker verification, needs 001+003)
    |
    v
WORK-005 (auth: login/me/logout)
    |
    v
WORK-006 (auth: forgot/change password)
    |
    v
WORK-007 (employee: create) --> WORK-008 (employee: read) --> WORK-009 (employee: update) --> WORK-010 (employee: delete)
    |
    v
WORK-011 (audit log listener)
    |
    +-----------------------------------------------+
    v                                                v
WORK-012 (fe: login) --> WORK-013 (fe: forgot/change password)
WORK-014 (fe: employee list) --> WORK-015 (fe: employee detail) --> WORK-016 (fe: employee create) --> WORK-017 (fe: employee edit)
    |
    v
WORK-018 (end-to-end integration & test pass) -- not started, out of the WORK-000..WORK-017 batch the user asked for
```

## Backlog Table
| ID | Title | Status | Depends On | Primary Specs |
| --- | --- | --- | --- | --- |
| WORK-000 | Resolve pending architecture decisions | **DONE** | — | See resolution above |
| WORK-001 | Backend project scaffolding | **IMPLEMENTED** | WORK-000 | `TECH-BACKEND`, `SOLUTION-BACKEND-ARCHITECTURE` |
| WORK-002 | Database schema & initial migration | **IMPLEMENTED** | WORK-000, WORK-001 | `DB-USER`, `DB-EMPLOYEE`, `DB-AUDIT-LOG` |
| WORK-003 | Frontend project scaffolding | **IMPLEMENTED** | WORK-000 | `TECH-FRONTEND`, `FRONTEND-ARCHITECTURE` |
| WORK-004 | Docker dev environment verification | IN PROGRESS (handed to user) | WORK-001, WORK-003 | `TECH-INFRASTRUCTURE`, `infra/` |
| WORK-005 | Auth API — login, me, logout | **IMPLEMENTED** | WORK-002 | `API-AUTHENTICATION` |
| WORK-006 | Auth API — forgot/change password | **IMPLEMENTED** | WORK-005 | `API-AUTHENTICATION` |
| WORK-007 | Employee API — create | **IMPLEMENTED** | WORK-002, WORK-005 | `API-EMPLOYEE-CREATE` |
| WORK-008 | Employee API — read (detail + list) | **IMPLEMENTED** | WORK-002, WORK-005 | `API-EMPLOYEE-DETAIL`, `API-EMPLOYEE-LIST` |
| WORK-009 | Employee API — update | **IMPLEMENTED** | WORK-007 | `API-EMPLOYEE-UPDATE` |
| WORK-010 | Employee API — delete | **IMPLEMENTED** | WORK-007 | `API-EMPLOYEE-DELETE` |
| WORK-011 | Audit log event listener | **IMPLEMENTED** | WORK-007, WORK-009, WORK-010, WORK-005 | `DB-AUDIT-LOG` |
| WORK-012 | Frontend page — login | **IMPLEMENTED** | WORK-003, WORK-005 | `FRONTEND-AUTH-LOGIN` |
| WORK-013 | Frontend page — forgot/change password | **IMPLEMENTED** | WORK-012, WORK-006 | `07-frontend/pages/{forgot,change}-password.md` |
| WORK-014 | Frontend page — employee list | **IMPLEMENTED** | WORK-012, WORK-008 | `FRONTEND-EMPLOYEE-LIST` |
| WORK-015 | Frontend page — employee detail | **IMPLEMENTED** | WORK-014, WORK-008 | `07-frontend/pages/employee-detail.md` |
| WORK-016 | Frontend page — employee create | **IMPLEMENTED** | WORK-014, WORK-007 | `07-frontend/pages/employee-create.md` |
| WORK-017 | Frontend page — employee edit | **IMPLEMENTED** | WORK-015, WORK-009 | `07-frontend/pages/employee-edit.md` |
| WORK-018 | End-to-end integration & test pass | DRAFT (not started) | all above | `08-testing/*` |

## Notes
- The user asked to implement `WORK-000` through `WORK-017` as one batch, then review before `WORK-018`.
- Backend items (`WORK-001`, `WORK-002`, `WORK-005`–`WORK-011`) and frontend items (`WORK-003`, `WORK-012`–`WORK-017`) are being built by two separate implementers since the frontend only depends on the documented API contract, not backend internals.
- `WORK-004` (Docker verification) and `WORK-018` (integration) require both halves finished and are handled after the backend/frontend implementers report back.
- Per the Session Context Log rule in `AGENTS.md`, `docs/09-workflow/session-context.md` is refreshed after this batch completes.
