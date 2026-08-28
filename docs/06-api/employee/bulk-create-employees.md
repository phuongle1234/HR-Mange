---
id: API-EMPLOYEE-BULK-CREATE
type: api
module: employee
status: draft
depends_on:
  - DB-EMPLOYEE
  - DB-ORGANIZATION
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Bulk Create Employees

## API
- Method: `POST`
- URL: `/api/employees/bulk`
- Status: draft

## Purpose
Create many employees in one request from the bulk table editor (`FRONTEND-EMPLOYEE-CREATE`). This is a new, additive endpoint — the existing single-record `POST /api/employees` (`API-EMPLOYEE-CREATE`) is unchanged and kept for compatibility; `/bulk` exists because `POST /api/employees` already means "create one" and cannot also mean "create many" on the same route/method.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may bulk-create employees.

## DTO And Field Validation
DTO name: `BulkCreateEmployeesDto`

| Field | Required | Validation |
| --- | --- | --- |
| `items` | yes | array, min `1`, max `100` |
| `items[].employeeCode` | yes | string, trim, max `50`, unique within request and unique in database |
| `items[].firstName` | yes | string, trim, max `100` |
| `items[].lastName` | yes | string, trim, max `100` |
| `items[].email` | yes | valid email, trim, lowercase, max `255`, unique within request and unique in database |
| `items[].phone` | no | string, max `30` |
| `items[].position` | no | string, max `100` |
| `items[].status` | no | one of `ACTIVE`, `INACTIVE`, `ON_LEAVE`, `TERMINATED`; default `ACTIVE` |
| `items[].organizationId` | no | integer, must reference an existing `organizations.id` when present |

Uniqueness is **not** checked with the per-field `@IsEmployeeCodeUnique`/`@IsEmployeeEmailUnique` decorators used by the single-record `API-EMPLOYEE-CREATE`. Those run one database query per field per row (N+1: 200 queries for a 100-row request) and cannot see sibling rows, so they cannot detect duplicates inside the same request. Instead, array-level constraints on `items` (`employee-bulk-dto.validator.ts`) check duplicates-within-request and database uniqueness in **one batched query**, and report per-row paths through the shared collector — see "Bulk Endpoint Field Error Paths" in `API-ERROR-RESPONSE`.

## Business Logic
1. Validate body.
2. Reject duplicate `employeeCode`/`email` values inside the request with `VALIDATION_ERROR`.
3. For any row with `organizationId` present, confirm it references an existing `Organization`; if not, return `400 ORGANIZATION_NOT_FOUND` for that row (row-scoped field error, not a request-wide failure — see Error Codes).
4. Controller maps each item to complete Prisma create data by adding `createdByUserId` and `updatedByUserId` from the current user.
5. Service calls inherited `createMany(dataArray, actorUserId)`.
6. On database unique conflict for `employeeCode`/`email`, return `409 EMPLOYEE_CODE_EXISTS`/`409 EMPLOYEE_EMAIL_EXISTS` (bulk path uses the 409 database-conflict pattern from `API-ORGANIZATION-TYPE-CREATE-MANY`, not the 400 `VALIDATION_ERROR` the existing single-create endpoint uses via its async DTO validator — the bulk endpoint cannot pre-check every row against the database inside a class-validator decorator the same way, so the conflict surfaces at the database layer instead; this is a deliberate, minor inconsistency versus `API-EMPLOYEE-CREATE`, recorded here rather than silently left).
7. Return created rows.

## Database Interaction
- Inherited `BaseService.createMany(dataArray, actorUserId)`.
- Expected Prisma operation: `createManyAndReturn({ data })`.

## Event Behavior
- Emits one shared `entity.created` event per created row.
- `entityType`: `EMPLOYEE`
- `entityId`: created row id as string
- `payload`: original create data passed to `BaseService.createMany`
- `actorUserId`: current user id

## Audit Log Behavior
- `AuditLogListener` maps the event to `EMPLOYEE_CREATED` (existing action, no new enum entry needed).

## Request Body
```json
{
  "items": [
    {
      "employeeCode": "EMP-1001",
      "firstName": "Nguyen",
      "lastName": "Van A",
      "email": "a@example.com",
      "organizationId": 3
    },
    {
      "employeeCode": "EMP-1002",
      "firstName": "Nguyen",
      "lastName": "Van B",
      "email": "b@example.com",
      "organizationId": null
    }
  ]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Employees created successfully.",
  "data": [
    {
      "id": "9c6b8e2a-1e3a-4f2a-9b0e-2f6a7c8d9e0f",
      "employeeCode": "EMP-1001",
      "firstName": "Nguyen",
      "lastName": "Van A",
      "email": "a@example.com",
      "phone": null,
      "position": null,
      "status": "ACTIVE",
      "organizationId": 3,
      "userId": null,
      "createdAt": "2026-08-26T10:00:00.000Z",
      "updatedAt": "2026-08-26T10:00:00.000Z"
    }
  ]
}
```

## HTTP Status
- Success: `201 Created`
- Validation error: `400 Bad Request`
- Conflict: `409 Conflict`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body validation failed, including duplicate `employeeCode`/`email` inside the request |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `ORGANIZATION_NOT_FOUND` | 400 | At least one row's `organizationId` does not reference an existing organization (field-scoped, not a row-existence 404, since the failing thing is the caller's own input) |
| `EMPLOYEE_CODE_EXISTS` | 409 | At least one `employeeCode` already exists in database |
| `EMPLOYEE_EMAIL_EXISTS` | 409 | At least one `email` already exists in database |

## Frontend Contract Notes
- Mutation key: `['employees', 'bulk-create']`.
- On success, invalidate `['employees']`.
- Create page redirects to `/employees`.
- Field errors arrive as granular dot paths — `items.0.employeeCode`, `items.1.email`, `items.2.organizationId` — one entry per offending row+field, and must be mapped to the corresponding table row/cell input. See `API-ERROR-RESPONSE` → "Bulk Endpoint Field Error Paths". Note the wire format is `items.0.email` (dot + index), not `items[0].email`.

## Ambiguities
None blocking. `organizationId` validation failure is specified as `400` rather than `404` because, unlike a URL path id, this is caller-supplied request body data being rejected — consistent with how `API-CONVENTIONS` treats other DTO-shape rejections.
