---
id: API-EMPLOYEE-LIST
type: api
module: employee
status: draft
depends_on:
  - BUSINESS-EMPLOYEE
  - DB-EMPLOYEE
---

# Get Employees

## API
- Method: `GET`
- URL: `/api/employees`
- Status: draft

## Controller
- Controller: `EmployeeController`
- Function: `findAll(query, currentUser)`
- Responsibility:
  - Receive HTTP request.
  - Validate query DTO through NestJS validation pipe.
  - Call `IEmployeeService.findAll(query, currentUser)`.
  - Return response through common response helper.

## Service
- Interface: `IEmployeeService`
- Implementation: `EmployeeService`
- Base contract: `BaseService.findAll(query)`
- Responsibility:
  - Map validated `GetEmployeesQueryDto` to Prisma `where`/`orderBy`/pagination options.
  - Call `this.entity.findMany({ where, orderBy, skip, take })` and `this.entity.count({ where })` (Prisma `employee` delegate, held via `BaseService`).
  - Return employee list and pagination metadata.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check (per `WORK-000` decision #2). Any authenticated user may list employees.

## DTO And Field Validation
DTO name: `GetEmployeesQueryDto`

| Field | Required | Validation |
| --- | --- | --- |
| `page` | no | positive integer, default `1` |
| `limit` | no | positive integer, default `10`, max `100` |
| `search` | no | string, trim, matches against `employeeCode`, `firstName`, `lastName`, `email` (case-insensitive) |
| `status` | no | one of `EmployeeStatus` |
| `sortBy` | no | one of `employeeCode`, `createdAt`; default `createdAt` |
| `sortOrder` | no | `asc` or `desc`; default `desc` |

There is no `departmentId` filter (Department was removed from scope).

## Business Logic
1. Request is injected into `EmployeeController.findAll(query, currentUser)`.
2. DTO validation runs before service is called.
3. Controller calls `IEmployeeService.findAll(query, currentUser)`.
4. Service maps validated query DTO to Prisma `where`/`orderBy`/pagination options.
5. Service calls `this.entity.findMany(...)` and `this.entity.count(...)`.
6. Service returns employee list and pagination metadata.

## Database Interaction
- Layer: `EmployeeService` (extends `BaseService`), no separate repository class
- Function: `this.entity.findMany({ where, orderBy, skip, take })` + `this.entity.count({ where })` — direct Prisma `employee` delegate calls
- Expected database operation: select Employee records with search/status filter, sorting, and pagination.

## Event Behavior
- None — read operation.

## Audit Log Behavior
- None — reads are not audited.

## Common Response
```json
{
  "success": true,
  "message": "Employees retrieved successfully.",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0
  }
}
```

## HTTP Status
- Success: `200 OK`
- Validation error: `400 Bad Request`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Query DTO validation failed |
| `UNAUTHORIZED` | 401 | Access token missing or invalid |

## Ambiguities
None blocking. Pagination defaults and sortable fields are `WORK-000`-adjacent implementation defaults, not separately user-confirmed.
