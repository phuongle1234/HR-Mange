---
id: BUSINESS-EMPLOYEE
type: business
module: employee
status: draft
---

# Employee Business Rules

## Purpose
Define employee-specific business rules for list, detail, create, update, and delete workflows.

## Current Rules
- Employee records represent people managed by the system.
- All list/detail/create/update/delete operations require authentication only — there is no per-operation permission (per `WORK-000` decision #2, any authenticated user can perform every operation).
- Create, update, and delete are important changes and require audit logging (`EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`, `EMPLOYEE_DELETED`).

## Field Rules
| Field | Rule |
| --- | --- |
| `employeeCode` | Unique, required, max 50 chars. |
| `firstName` | Required for create; optional changed field for update, max 100 chars. |
| `lastName` | Required for create; optional changed field for update, max 100 chars. |
| `email` | Unique, required, max 255 chars, lowercased/trimmed. |
| `phone` | Optional, max 30 chars. |
| `position` | Optional, max 100 chars. |
| `status` | One of `ACTIVE`, `INACTIVE`, `ON_LEAVE`, `TERMINATED`; defaults to `ACTIVE`. |

There is no `departmentId` field — Department was removed from scope (`WORK-000` decision #1).

## Delete Rules
- Delete requires confirmation in the frontend (confirm popup).
- Delete is a hard delete — the row is permanently removed (`WORK-000` decision #3).
- Audit log (`EMPLOYEE_DELETED`) is required, capturing the employee code before removal.

## Ambiguities
None blocking. Field max lengths and the status enum values are `WORK-000` documented defaults, not separately user-confirmed, and can be adjusted later without a structural change.
