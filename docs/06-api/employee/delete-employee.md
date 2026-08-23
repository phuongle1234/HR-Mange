---
id: API-EMPLOYEE-DELETE
type: api
module: employee
status: draft
depends_on:
  - BUSINESS-EMPLOYEE
  - DB-EMPLOYEE
---

# Delete Employee

## API
- Method: `DELETE`
- URL: `/api/employees/:id`
- Status: draft

## Controller
- Controller: `EmployeeController`
- Function: `delete(id, currentUser)`

## Service
- Interface: `IEmployeeService`
- Implementation: `EmployeeService` does not override `delete` — it is fully inherited from `BaseService.delete(id, actorUserId)`, since deletion needs no Employee-specific mapping.
- Responsibility (`BaseService.delete`, shared across entities) — deliberately minimal, no snapshot:
  - Call `this.entity.delete({ where: { id } })` directly (Prisma `employee` delegate, hard delete — per `WORK-000` decision #3). **No query beforehand** — delete carries no business payload to snapshot, so there is nothing to query for.
  - If Prisma reports the row doesn't exist (`PrismaClientKnownRequestError` code `P2025`), translate it to `EmployeeNotFoundException`.
  - Emit the generic `entity.deleted` event with `payload = {}` (empty — delete has no business data) and actor `deletedByUserId` from `currentUser`.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check (per `WORK-000` decision #2). Any authenticated user may delete an employee.

## DTO And Field Validation
DTO name: `EmployeeIdParamDto`

| Field | Required | Validation |
| --- | --- | --- |
| `id` | yes | UUID, not empty, must reference an existing employee |

## Business Logic
1. Request is injected into `EmployeeController.delete(id, currentUser)`.
2. DTO validation runs before service is called (route param shape only).
3. Controller calls `IEmployeeService.delete(id, currentUser)`, which resolves directly to `BaseService.delete`.
4. `BaseService.delete` calls `this.entity.delete({ where: { id } })` directly — no existence check beforehand, permanently removes the row.
5. If Prisma reports the row doesn't exist (`P2025`), `BaseService.delete` throws `EMPLOYEE_NOT_FOUND`.
6. `BaseService.delete` emits the generic `entity.deleted` event with `payload = {}`.
7. Service returns (`void`).

## Database Interaction
- Layer: `BaseService.delete` (shared across entities), no separate repository class
- Function: `this.entity.delete({ where: { id } })` — direct Prisma `employee` delegate call, hard delete, permanently removes the row; not-found is detected from this call's own error (`P2025`), not a preceding query.

## Event Behavior
- Event: `entity.deleted` (`ENTITY_DELETED_EVENT`, class `EntityCrudEvent`) — shared by every entity, not Employee-specific.
- Producer: `BaseService.delete`.
- Consumer: `AuditLogListener.handleEntityDeleted`.
- Payload: `{ entityType: 'EMPLOYEE', entityId: id, payload: {}, actorUserId, occurredAt }` — no row snapshot, by design (see Service section above).

## Audit Log Behavior
- Required: yes
- Audit action: `EMPLOYEE_DELETED` (`AuditLogListener` maps `entityType: EMPLOYEE` + deleted → `AuditAction.EMPLOYEE_DELETED`).
- Audit payload: `{}` (`event.payload`) — deliberately no business-data snapshot. The audit log row's `entityId`/`performedByUserId`/`action`/`createdAt` already record *what* was deleted, *who* did it, and *when*; a pre-delete row snapshot was judged unnecessary for this phase.

## Common Response
```json
{
  "success": true,
  "message": "Employee deleted successfully.",
  "data": null,
  "meta": null
}
```

## HTTP Status
- Success: `200 OK`
- Unauthorized: `401 Unauthorized`
- Not found: `404 Not Found`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `EMPLOYEE_NOT_FOUND` | 404 | Employee does not exist |
| `VALIDATION_ERROR` | 400 | Route param validation failed |
| `UNAUTHORIZED` | 401 | Access token missing or invalid |

## Ambiguities
None blocking. Whether related records (future) block delete is not applicable yet — no other entity currently references `Employee`.
