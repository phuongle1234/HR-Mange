---
id: API-EMPLOYEE-BULK-DELETE
type: api
module: employee
status: draft
depends_on:
  - DB-EMPLOYEE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Bulk Delete Employees

## API
- Method: `DELETE`
- URL: `/api/employees/bulk`
- Status: draft

## Purpose
Delete many employees in one request, from Employee List multi-select bulk delete and from the bulk table editor's Delete action. Additive alongside the existing single-record `DELETE /api/employees/:id` (`API-EMPLOYEE-DELETE`), which is unchanged.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may bulk-delete employees.

## DTO And Field Validation
DTO name: `BulkDeleteEmployeesDto`

| Field | Required | Validation |
| --- | --- | --- |
| `ids` | yes | array of UUID strings, min `1`, max `100`, no duplicate ids |

## Business Logic
1. Validate body.
2. Confirm every id exists. If any id is missing, return `404 EMPLOYEE_NOT_FOUND`.
3. Delete all requested rows in one database operation (hard delete, per `WORK-000` decision #3 — same as the single-record delete).
4. Return deleted count.

Deleting an employee that has `Invitation` rows cascades those rows away (`DB-INVITATION`, `ON DELETE CASCADE`) — no separate cleanup step is needed here.

## Database Interaction
- Use inherited `findByIds(ids)` for existence check.
- Use inherited `deleteMany(ids, actorUserId)`. `BaseService` builds `where: { id: { in: ids } }` internally and returns the deleted count.

## Event Behavior
- `BaseService.deleteMany` emits one shared `entity.deleted` event for the batch.
- `entityType`: `EMPLOYEE`
- `entityId`: `BULK`
- `payload`: `{ "where": { "id": { "in": ids } } }`
- `actorUserId`: current user id

## Audit Log Behavior
- `AuditLogListener` maps the event to `EMPLOYEE_DELETED` (existing action). One audit log row for the whole batch, not one per deleted row.

## Request Body
```json
{
  "ids": [
    "9c6b8e2a-1e3a-4f2a-9b0e-2f6a7c8d9e0f",
    "3f2a1c4b-5d6e-7f8a-9b0c-1d2e3f4a5b6c"
  ]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Employees deleted successfully.",
  "data": {
    "deletedCount": 2
  }
}
```

## HTTP Status
- Success: `200 OK`
- Validation error: `400 Bad Request`
- Not found: `404 Not Found`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body validation failed |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `EMPLOYEE_NOT_FOUND` | 404 | At least one requested id does not exist |

## Frontend Contract Notes
- Mutation key: `['employees', 'bulk-delete']`.
- On success, invalidate `['employees']` and clear the `employee_checked` Redux selection.
- Employee List's multi-select bulk delete and the bulk table editor's row-delete-and-submit action both call this endpoint once per confirmed action, passing an array of ids.

## Ambiguities
None.
