---
id: API-ORGANIZATION-TYPE-DELETE-MANY
type: api
module: organization-type
status: draft
depends_on:
  - DB-ORGANIZATION-TYPE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Delete Organization Types

## API
- Method: `DELETE`
- URL: `/api/organization-types`
- Status: draft

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may delete organization types.

## DTO And Field Validation
DTO name: `DeleteOrganizationTypesDto`

| Field | Required | Validation |
| --- | --- | --- |
| `ids` | yes | array of UUID strings, min `1`, max `100`, no duplicate ids |

## Business Logic
1. Validate body.
2. Confirm every id exists. If any id is missing, return `404 ORGANIZATION_TYPE_NOT_FOUND`.
3. Delete all requested rows in one database operation or transaction.
4. Return deleted count.

## Database Interaction
- Use inherited `findByIds(ids)` for existence check.
- Use inherited `deleteMany(ids, actorUserId)` for deletion. `BaseService` builds `where: { id: { in: ids } }` internally and returns the deleted count.

## Event Behavior
- `BaseService.deleteMany` emits one shared `entity.deleted` event for the batch.
- `entityType`: `ORGANIZATION_TYPE`
- `entityId`: `BULK`
- `payload`: `{ "where": { "id": { "in": ids } } }`
- `actorUserId`: current user id

## Audit Log Behavior
- `AuditLogListener` maps the event to `ORGANIZATION_TYPE_DELETED`.
- One audit log row is written for the whole batch, not one per deleted row.

## Request Body
```json
{
  "ids": [
    "7f53fb72-bbb8-4633-ae91-90f41c4b2a4e",
    "eaf6d498-3ca3-4b0c-a4fb-81512c76e4a1"
  ]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Organization types deleted successfully.",
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
| `ORGANIZATION_TYPE_NOT_FOUND` | 404 | At least one requested id does not exist |

## Frontend Contract Notes
- Mutation key: `['organization-types', 'delete-many']`.
- On success, invalidate `['organization-types']`.
- List page must call this endpoint once per confirmed bulk delete action.

## Ambiguities
None.
