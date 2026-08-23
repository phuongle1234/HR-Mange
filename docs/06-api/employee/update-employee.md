---
id: API-EMPLOYEE-UPDATE
type: api
module: employee
status: draft
depends_on:
  - BUSINESS-EMPLOYEE
  - DB-EMPLOYEE
---

# Update Employee

## API
- Method: `PUT`
- URL: `/api/employees/:id`
- Status: draft

## Controller
- Controller: `EmployeeController`
- Function: `update(id, dto, currentUser)`
- `@UseInterceptors(AttachRouteIdInterceptor)`: copies the route `:id` param onto `request.body.id` before the global `ValidationPipe` runs (interceptors execute before pipes), so the DTO's async uniqueness validators can exclude the record being updated. This `id` is never client-supplied.
- The controller itself destructures `dto.id` off before calling the service: `const { id: _validatorOnly, ...data } = dto;` — the interceptor-populated `id` exists only for the uniqueness validators and must never reach the service/persistence layer. `BaseService` does not strip it (it never drops or alters fields the caller passes it), so stripping happens at the one place that actually knows this field is validator-only: the controller.

## Service
- Interface: `IEmployeeService`
- Implementation: `EmployeeService` does not override `update` — it is fully inherited from `BaseService.update(id, data, actorUserId)`.
- Responsibility (`BaseService.update`, shared across entities):
  - Build a *separate* object for the Prisma write only: `{ ...data, updatedByUserId: actorUserId }` — the caller's original `data` is never mutated.
  - Call `this.entity.update({ where: { id }, data: <that separate object> })`.
  - If Prisma throws a not-found error (`PrismaClientKnownRequestError` code `P2025`), translate it to `EmployeeNotFoundException` — no query is made beforehand to check existence.
  - Emit the generic `entity.updated` event with `payload` set to the caller's original `data` (unmerged, unmodified).

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check (per `WORK-000` decision #2). Any authenticated user may update an employee.

## DTO And Field Validation
Param DTO name: `EmployeeIdParamDto`
Body DTO name: `UpdateEmployeeDto`

| Field | Required | Validation |
| --- | --- | --- |
| `id` | yes | UUID, not empty |
| `employeeCode` | no | string, trim, not empty when provided, max 50 chars, unique excluding current employee |
| `firstName` | no | string, trim, not empty when provided, max 100 chars |
| `lastName` | no | string, trim, not empty when provided, max 100 chars |
| `email` | no | valid email format, trim, lowercase, unique excluding current employee |
| `phone` | no | string, trim, max 30 chars |
| `position` | no | string, trim, max 100 chars |
| `status` | no | one of `EmployeeStatus` |

There is no `departmentId` field.

Uniqueness of `employeeCode` and `email` uses the same `@IsEmployeeCodeUnique()`/`@IsEmployeeEmailUnique()` validators as create (`src/modules/employee/validators/employee-unique.validator.ts`), excluding the row identified by `dto.id` (populated from the route param by `AttachRouteIdInterceptor`) so a request that doesn't change the value does not report a false duplicate against itself.

## Business Logic
1. Request is injected into `EmployeeController.update(id, dto, currentUser)`.
2. `AttachRouteIdInterceptor` copies route `:id` onto `dto.id` before validation.
3. DTO validation runs before service is called, including `@IsEmployeeCodeUnique()`/`@IsEmployeeEmailUnique()` (excluding the current row via `dto.id`).
4. Controller strips `dto.id` (`const { id: _validatorOnly, ...data } = dto;`) — `data` is now exactly the business fields the client sent, nothing added or removed.
5. Controller calls `IEmployeeService.update(id, data, currentUser)`, which resolves directly to `BaseService.update`.
6. `BaseService.update` builds `{ ...data, updatedByUserId: currentUser.id }` as a *separate* object and calls `this.entity.update({ where: { id }, data: <that object> })` — no existence check beforehand.
7. If Prisma reports the row doesn't exist (`P2025`), `BaseService.update` throws `EMPLOYEE_NOT_FOUND`.
8. `BaseService.update` emits the generic `entity.updated` event (`EntityCrudEvent`) with `entityType = EMPLOYEE`, `payload = data` (the controller's clean input, not the updated row), and the actor. This fires on every successful update call, not only when a field's value actually changed.
9. Service returns updated employee.

## Database Interaction
- Layer: `BaseService.update` (shared across entities), no separate repository class
- Function: `this.entity.update({ where: { id }, data })` — direct Prisma `employee` delegate call; not-found is detected from this call's own error (`P2025`), not a preceding query

## Event Behavior
- Event: `entity.updated` (`ENTITY_UPDATED_EVENT`, class `EntityCrudEvent`) — shared by every entity, not Employee-specific.
- Producer: `BaseService.update`.
- Consumer: `AuditLogListener.handleEntityUpdated`.
- Payload: `{ entityType: 'EMPLOYEE', entityId: id, payload: <the data the controller passed, after stripping dto.id>, actorUserId, occurredAt }` — **not** the row Prisma returns.

## Audit Log Behavior
- Required: yes
- Audit action: `EMPLOYEE_UPDATED` (`AuditLogListener` maps `entityType: EMPLOYEE` + updated → `AuditAction.EMPLOYEE_UPDATED`).
- Audit payload: exactly the data the controller sent to `update` (`event.payload`), stored as-is as `AuditLog.payload` — reflects what was requested for this update, not the full row nor a `changedFields` diff.

## Common Response
```json
{
  "success": true,
  "message": "Employee updated successfully.",
  "data": {},
  "meta": null
}
```

## HTTP Status
- Success: `200 OK`
- Validation error: `400 Bad Request`
- Unauthorized: `401 Unauthorized`
- Not found: `404 Not Found`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `EMPLOYEE_NOT_FOUND` | 404 | Employee does not exist |
| `VALIDATION_ERROR` | 400 | Param or body validation failed, including duplicate `employeeCode`/`email` (`fieldErrors.employeeCode` / `fieldErrors.email`) |
| `UNAUTHORIZED` | 401 | Access token missing or invalid |

## Ambiguities
None blocking.
