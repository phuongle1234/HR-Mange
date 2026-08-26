---
id: API-EMPLOYEE-BULK-UPDATE
type: api
module: employee
status: draft
depends_on:
  - DB-EMPLOYEE
  - DB-ORGANIZATION
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Bulk Update Employees

## API
- Method: `PATCH`
- URL: `/api/employees/bulk`
- Status: draft

## Purpose
Update many employees in one request from the bulk table editor's update mode (`FRONTEND-EMPLOYEE-EDIT`). Additive alongside the existing single-record `PUT /api/employees/:id` (`API-EMPLOYEE-UPDATE`), which is unchanged.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may bulk-update employees.

## DTO And Field Validation
DTO name: `BulkUpdateEmployeesDto`

| Field | Required | Validation |
| --- | --- | --- |
| `items` | yes | array, min `1`, max `100` |
| `items[].id` | yes | UUID string |
| `items[].employeeCode` | no | string, trim, max `50`, unique within request when present and unique in database excluding its own row |
| `items[].firstName` | no | string, trim, max `100` |
| `items[].lastName` | no | string, trim, max `100` |
| `items[].email` | no | valid email, trim, lowercase, max `255`, unique within request when present and unique in database excluding its own row |
| `items[].phone` | no | string, max `30`, or `null` to clear |
| `items[].position` | no | string, max `100`, or `null` to clear |
| `items[].status` | no | one of `ACTIVE`, `INACTIVE`, `ON_LEAVE`, `TERMINATED` |
| `items[].organizationId` | no | integer, must reference an existing `organizations.id` when present, or `null` to clear |

At least one mutable field must be present per item (same reusable-DTO-validator pattern as `API-ORGANIZATION-TYPE-UPDATE-MANY`). `userId` is never accepted here — only the Invitation-accept flow sets it.

## Business Logic
1. Validate body.
2. Reject duplicate ids inside the request with `VALIDATION_ERROR`.
3. Reject duplicate submitted `employeeCode`/`email` values inside the request with `VALIDATION_ERROR`.
4. Confirm every id exists. If any id is missing, return `404 EMPLOYEE_NOT_FOUND`.
5. For any row with `organizationId` present and non-null, confirm it references an existing `Organization`; if not, return `400 ORGANIZATION_NOT_FOUND`.
6. Controller adds `updatedByUserId` from the current user to each update item's `data`, and only includes fields actually present in the validated DTO (per the project's controller bulk-mapping rule — no fake defaults such as `phone: item?.phone || ''`).
7. Apply updates through inherited `BaseService.updateMany(items, actorUserId)`, where each item is shaped as `{ id, data }`.
8. On database unique conflict for `employeeCode`/`email`, return `409 EMPLOYEE_CODE_EXISTS`/`409 EMPLOYEE_EMAIL_EXISTS`.
9. Return updated rows in the same order as request items.

## Database Interaction
- Inherited `BaseService.updateMany(items, actorUserId)`, delegating each item to `update(id, data, actorUserId)`.

## Event Behavior
- Emits one shared `entity.updated` event per updated row.
- `entityType`: `EMPLOYEE`
- `entityId`: updated row id as string
- `payload`: update data for that row, including `updatedByUserId`
- `actorUserId`: current user id

## Audit Log Behavior
- `AuditLogListener` maps the event to `EMPLOYEE_UPDATED` (existing action).

## Request Body
```json
{
  "items": [
    {
      "id": "9c6b8e2a-1e3a-4f2a-9b0e-2f6a7c8d9e0f",
      "organizationId": 5,
      "position": "Senior Engineer"
    }
  ]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Employees updated successfully.",
  "data": [
    {
      "id": "9c6b8e2a-1e3a-4f2a-9b0e-2f6a7c8d9e0f",
      "employeeCode": "EMP-1001",
      "firstName": "Nguyen",
      "lastName": "Van A",
      "email": "a@example.com",
      "phone": null,
      "position": "Senior Engineer",
      "status": "ACTIVE",
      "organizationId": 5,
      "userId": null,
      "createdAt": "2026-08-26T10:00:00.000Z",
      "updatedAt": "2026-08-26T10:20:00.000Z"
    }
  ]
}
```

## HTTP Status
- Success: `200 OK`
- Validation error: `400 Bad Request`
- Conflict: `409 Conflict`
- Not found: `404 Not Found`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body validation failed |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `EMPLOYEE_NOT_FOUND` | 404 | At least one requested id does not exist |
| `ORGANIZATION_NOT_FOUND` | 400 | At least one row's `organizationId` does not reference an existing organization |
| `EMPLOYEE_CODE_EXISTS` | 409 | At least one submitted `employeeCode` already exists on another row |
| `EMPLOYEE_EMAIL_EXISTS` | 409 | At least one submitted `email` already exists on another row |

## Frontend Contract Notes
- Mutation key: `['employees', 'bulk-update']`.
- On success, invalidate `['employees']` and `['employees', 'by-ids', ids]`.
- Update page redirects to `/employees`.
- Field errors for `items[n].*` must be mapped to the corresponding table row/cell input, including the `react-select` Organization cell for `items[n].organizationId`.

## Ambiguities
None.
