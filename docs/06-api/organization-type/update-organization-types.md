---
id: API-ORGANIZATION-TYPE-UPDATE-MANY
type: api
module: organization-type
status: draft
depends_on:
  - DB-ORGANIZATION-TYPE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Update Organization Types

## API
- Method: `PATCH`
- URL: `/api/organization-types`
- Status: draft

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may update organization types.

## DTO And Field Validation
DTO name: `UpdateOrganizationTypesDto`

| Field | Required | Validation |
| --- | --- | --- |
| `items` | yes | array, min `1`, max `100` |
| `items[].id` | yes | UUID string |
| `items[].name` | no | string, trim, max `100`, unique within request when present and unique in database excluding its own row |
| `items[].description` | no | string, trim, max `1000`, empty string normalized to `null` |

At least one mutable field (`name` or `description`) must be present per item.

## Business Logic
1. Validate body.
2. Reject duplicate ids inside the request with `VALIDATION_ERROR`.
3. Reject duplicate submitted names inside the request with `VALIDATION_ERROR`.
4. Confirm every id exists. If any id is missing, return `404 ORGANIZATION_TYPE_NOT_FOUND`.
5. Controller adds `updatedByUserId` from the current user to each update item's `data` before calling the service.
6. Apply updates through inherited `BaseService.updateMany(items, actorUserId)`, where each item is shaped as `{ id, data }`.
7. On database unique conflict for `name`, return `409 ORGANIZATION_TYPE_NAME_EXISTS`.
8. Return updated rows in the same order as request items.

## Database Interaction
- Use inherited `BaseService.updateMany(items, actorUserId)`.
- `BaseService.updateMany` accepts per-row update items and delegates each item to `update(id, data, actorUserId)`.
- The controller must only include mutable fields that were present in the validated DTO, plus `updatedByUserId`; it must not perform validation itself.

## Event Behavior
- Emits one shared `entity.updated` event per updated row.
- `entityType`: `ORGANIZATION_TYPE`
- `entityId`: updated row id as string
- `payload`: update data for that row, including `updatedByUserId`
- `actorUserId`: current user id

## Audit Log Behavior
- `AuditLogListener` maps the event to `ORGANIZATION_TYPE_UPDATED`.
- Audit payload contains only the update data passed for that row, not a full database snapshot.

## Request Body
```json
{
  "items": [
    {
      "id": "7f53fb72-bbb8-4633-ae91-90f41c4b2a4e",
      "name": "Department",
      "description": "Updated description"
    }
  ]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Organization types updated successfully.",
  "data": [
    {
      "id": "7f53fb72-bbb8-4633-ae91-90f41c4b2a4e",
      "name": "Department",
      "description": "Updated description",
      "createdAt": "2026-08-24T10:00:00.000Z",
      "updatedAt": "2026-08-24T10:15:00.000Z",
      "createdByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5",
      "updatedByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5"
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
| `ORGANIZATION_TYPE_NOT_FOUND` | 404 | At least one requested id does not exist |
| `ORGANIZATION_TYPE_NAME_EXISTS` | 409 | At least one submitted name already exists on another row |

## Frontend Contract Notes
- Mutation key: `['organization-types', 'update-many']`.
- On success, invalidate `['organization-types']` and `['organization-types', 'by-ids', ids]`.
- Update page redirects to `/organizations/types`.
- Field errors for `items[n].name` or `items[n].description` must be mapped to the corresponding table row input.

## Ambiguities
None.
