---
id: API-EMPLOYEE-CREATE
type: api
module: employee
status: draft
depends_on:
  - BUSINESS-EMPLOYEE
  - DB-EMPLOYEE
---

# Create Employee

## API
- Method: `POST`
- URL: `/api/employees`
- Status: draft

## Controller
- Controller: `EmployeeController`
- Function: `create(dto, currentUser)`
- Responsibility:
  - Receive HTTP request.
  - Validate request DTO through NestJS validation pipe.
  - Read authenticated user from request context.
  - Call `IEmployeeService.create(dto, currentUser)`.
  - Return response through common response helper.

## Service
- Interface: `IEmployeeService`
- Implementation: `EmployeeService` does not override `create` — it is fully inherited from `BaseService.create(dto, actorUserId)`.
- Function: `create(dto, currentUser)`
- Dependency injection:
  - `EmployeeController` receives `IEmployeeService` through constructor DI.
  - Controller must call the interface, not the concrete service class.
  - `EmployeeService` implements `IEmployeeService` and extends `BaseService<Employee, PrismaService['employee'], ...>`, which holds the injected Prisma `employee` delegate as `this.entity`.
  - `currentUser` is used by `BaseService.create(dto, currentUser)` as the event/audit actor.
- Responsibility (`BaseService.create`, shared across entities):
  - Spread validated `CreateEmployeeDto` directly as Prisma create data, adding `createdByUserId`/`updatedByUserId` from `currentUser` (convention: entities on `BaseService` have these two audit columns — see AGENTS.md Backend Rules).
  - Call `this.entity.create({ data })` and emit the generic `entity.created` event.
  - Return created employee data to controller.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check (per `WORK-000` decision #2). Any authenticated user may create an employee.
- Backend authentication guard is the final security boundary.

## Request Headers
- `Authorization`: Bearer access token.
- `Content-Type`: `application/json`

## DTO And Field Validation
DTO name: `CreateEmployeeDto`

| Field | Required | Validation |
| --- | --- | --- |
| `employeeCode` | yes | string, trim, not empty, max 50 chars, unique in Employee table |
| `firstName` | yes | string, trim, not empty, max 100 chars |
| `lastName` | yes | string, trim, not empty, max 100 chars |
| `email` | yes | valid email format, trim, lowercase, unique in Employee table |
| `phone` | no | string, trim, max 30 chars |
| `position` | no | string, trim, max 100 chars |
| `status` | no | one of `EmployeeStatus` (`ACTIVE`, `INACTIVE`, `ON_LEAVE`, `TERMINATED`); defaults to `ACTIVE` |

There is no `departmentId` field (Department was removed from scope, per `WORK-000` decision #1).

Uniqueness of `employeeCode` and `email` is enforced by async custom validators directly on the DTO: `@IsEmployeeCodeUnique()` and `@IsEmployeeEmailUnique()` (`src/modules/employee/validators/employee-unique.validator.ts`). Each queries `PrismaService` (resolved through Nest's DI container via `useContainer` in `main.ts`) and fails validation if another `Employee` row already has that value. This runs inside the global `ValidationPipe`, before the controller/service is invoked.

## Business Logic
1. Request is injected into `EmployeeController.create(dto, currentUser)`.
2. DTO validation runs before service is called (required fields, formats, max lengths).
3. `@IsEmployeeCodeUnique()` checks duplicate `employeeCode` (async, DB-backed).
4. `@IsEmployeeEmailUnique()` checks duplicate `email` (async, DB-backed).
5. Controller calls `IEmployeeService.create(dto, currentUser)`, which resolves directly to `BaseService.create`.
6. `BaseService.create` spreads the validated DTO as Prisma create data, adding `createdByUserId`/`updatedByUserId` from `currentUser`.
7. `BaseService.create` calls `this.entity.create({ data })` (Prisma `employee` delegate).
8. `BaseService.create` emits the generic `entity.created` event (`EntityCrudEvent`, `common/events/entity-crud.event.ts`) with `entityType = EMPLOYEE`, the created row, and the actor.
9. Service returns created employee.

## Database Interaction
- Layer: `BaseService.create` (shared across entities), no separate repository class
- Function: `this.entity.create({ data })` — direct Prisma `employee` delegate call
- Expected database operation: insert one Employee record.
- Only uniqueness validation stays entity-specific (`@IsEmployeeCodeUnique()`/`@IsEmployeeEmailUnique()` on the DTO); the DTO-to-Prisma spread, the Prisma call, and event emission are all shared, generic behavior in `BaseService` — `EmployeeService` does not override `create`.

## Event Behavior
- Event: `entity.created` (`ENTITY_CREATED_EVENT`, class `EntityCrudEvent`) — shared by every entity, not Employee-specific.
- Trigger: after `BaseService.create` commits the insert.
- Producer: `BaseService.create`.
- Consumer: `AuditLogListener.handleEntityCreated` (see `WORK-011`).
- Payload: `{ entityType: 'EMPLOYEE', entityId: <created row's id>, payload: <the exact CreateEmployeeDto the controller passed in>, actorUserId, occurredAt }` — **not** the row Prisma returns and **not** merged with `createdByUserId`/`updatedByUserId` (those are added only to a separate object used for the Prisma write itself).

## Audit Log Behavior
- Required: yes
- Audit action: `EMPLOYEE_CREATED` (`AuditLogListener` maps `entityType: EMPLOYEE` + created → `AuditAction.EMPLOYEE_CREATED`).
- Mechanism: `AuditLogListener.handleEntityCreated` consumes `entity.created`.
- Audit payload: exactly the `CreateEmployeeDto` data the controller passed to `create` (`event.payload`), stored as-is as `AuditLog.payload` — reflects what was requested, not the persisted row's generated/system fields.

## Common Response
```text
ResponseHelper.success({ data, message, meta })
```

Response shape:
```json
{
  "success": true,
  "message": "Employee created successfully.",
  "data": {},
  "meta": null
}
```

## HTTP Status
- Success: `201 Created`
- Validation error: `400 Bad Request`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Request DTO validation failed, including duplicate `employeeCode`/`email` (`fieldErrors.employeeCode` / `fieldErrors.email`) |
| `UNAUTHORIZED` | 401 | Access token missing or invalid |

## Ambiguities
None blocking. Status enum values and field max lengths are `WORK-000` documented defaults, not final user sign-off.
