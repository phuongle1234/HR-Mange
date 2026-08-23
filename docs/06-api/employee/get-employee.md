---
id: API-EMPLOYEE-DETAIL
type: api
module: employee
status: draft
depends_on:
  - BUSINESS-EMPLOYEE
  - DB-EMPLOYEE
---

# Get Employee

## API
- Method: `GET`
- URL: `/api/employees/:id`
- Status: draft

## Controller
- Controller: `EmployeeController`
- Function: `findOne(id, currentUser)`
- Responsibility:
  - Receive HTTP request.
  - Validate route param DTO through NestJS validation pipe.
  - Call `IEmployeeService.findOne(id, currentUser)`.
  - Return response through common response helper.

## Service
- Interface: `IEmployeeService`
- Implementation: `EmployeeService` does not override `findOne` — it is fully inherited from `BaseService.findOne(id)`, constructed with `(id) => new EmployeeNotFoundException(id)` as the not-found factory.
- Responsibility (`BaseService.findOne`, shared across entities):
  - Call `this.entity.findUnique({ where: { id } })` (Prisma `employee` delegate, held via `BaseService`).
  - Return employee detail, or throw `EMPLOYEE_NOT_FOUND` if it does not exist.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check (per `WORK-000` decision #2). Any authenticated user may view employee detail.

## DTO And Field Validation
DTO name: `EmployeeIdParamDto`

| Field | Required | Validation |
| --- | --- | --- |
| `id` | yes | UUID, not empty |

## Business Logic
1. Request is injected into `EmployeeController.findOne(id, currentUser)`.
2. DTO validation runs before service is called.
3. Controller calls `IEmployeeService.findOne(id, currentUser)`.
4. Service calls `this.entity.findUnique({ where: { id } })`.
5. Service returns employee detail or throws `EMPLOYEE_NOT_FOUND`.

## Database Interaction
- Layer: `EmployeeService` (extends `BaseService`), no separate repository class
- Function: `this.entity.findUnique({ where: { id } })` — direct Prisma `employee` delegate call
- Expected database operation: select one Employee record by ID.

## Event Behavior
- None — read operation, no state change.

## Audit Log Behavior
- None — reads are not audited.

## Common Response
```json
{
  "success": true,
  "message": "Employee retrieved successfully.",
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
| `VALIDATION_ERROR` | 400 | Route param validation failed |
| `UNAUTHORIZED` | 401 | Access token missing or invalid |

## Ambiguities
None blocking.
