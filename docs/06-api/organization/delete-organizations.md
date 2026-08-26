---
id: API-ORGANIZATION-DELETE-MANY
type: api
module: organization
status: draft
depends_on:
  - DB-ORGANIZATION
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Delete Organizations

## API
- Method: `DELETE`
- URL: `/api/organizations`
- Status: draft

## Purpose
Document the existing bulk-delete endpoint, unchanged by this daily task other than this write-up.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may delete organizations.

## DTO And Field Validation
DTO name: `DeleteOrganizationsDto`

| Field | Required | Validation |
| --- | --- | --- |
| `ids` | yes | array of integers, min `1`, no duplicate ids |

## Business Logic
1. Validate body.
2. Delete all requested rows in one database operation.
3. Return deleted count.

Deleting an `Organization` referenced by `Employee.organizationId` sets those employees' `organizationId` to `null` (`ON DELETE SET NULL`, `DB-EMPLOYEE`) — it does not block the delete and does not delete the employees. Deleting an `Organization` that is a parent detaches its children the same way (existing `parentId` behavior, unchanged).

## Database Interaction
- Use inherited `deleteMany(ids, actorUserId)`. `BaseService` builds `where: { id: { in: ids } }` internally and returns the deleted count. (The current controller does not pre-check existence via `findByIds` the way `OrganizationType`'s delete does — this is existing behavior, unchanged by this contract.)

## Event Behavior
- `BaseService.deleteMany` emits one shared `entity.deleted` event for the batch.
- `entityType`: `ORGANIZATION`
- `entityId`: `BULK`
- `payload`: `{ "where": { "id": { "in": ids } } }`
- `actorUserId`: current user id

## Audit Log Behavior
- `AuditLogListener` maps the event to `ORGANIZATION_DELETED` (existing action). One audit log row for the whole batch.

## Request Body
```json
{
  "ids": [3, 4]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Organizations deleted successfully.",
  "data": {
    "deletedCount": 2
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
| `VALIDATION_ERROR` | 400 | Body validation failed |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |

## Frontend Contract Notes
- Mutation key: `['organizations', 'delete-many']`.
- On success, invalidate `['organizations']`.
- Deleting a node in the org-chart deletes it and every descendant client-side (`removeOrganizationTree`, `FRONTEND-ORGANIZATION-CHART`) — once wired to this real endpoint, the frontend must collect all affected ids (target + descendants) and call this endpoint once with the full `ids` array, matching the existing local "Frontend Stage" delete semantics.

## Ambiguities
None new. The existing "cascade to descendants vs. detach only" ambiguity recorded in `DB-ORGANIZATION` concerns the database-level `parentId` FK behavior, not this endpoint's own request contract.
