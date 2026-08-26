---
id: API-ORGANIZATION-UPDATE-MANY
type: api
module: organization
status: draft
depends_on:
  - DB-ORGANIZATION
  - DB-ORGANIZATION-TYPE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Update Organizations

## API
- Method: `PATCH`
- URL: `/api/organizations`
- Status: draft

## Purpose
Document the existing bulk-update endpoint and extend it with `organizationTypeId`, so the frontend can wire the real Edit modal (`FRONTEND-ORGANIZATION-CHART`'s `EditOrganizationModal`) against it.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may update organizations.

## DTO And Field Validation
DTO name: `UpdateOrganizationsDto` (each item is `UpdateOrganizationItemDto`, extending `UpdateOrganizationDto` with a required `id`)

| Field | Required | Validation |
| --- | --- | --- |
| `items` | yes | array, min `1` |
| `items[].id` | yes | integer |
| `items[].code` | no | string, trim, max `50` |
| `items[].name` | no | string, trim, max `255` |
| `items[].description` | no | string |
| `items[].parentId` | no | integer, or `null` to detach from parent |
| `items[].type` | no | one of `COMPANY`, `BRANCH`, `DIVISION`, `DEPARTMENT`, `TEAM` |
| `items[].organizationTypeId` | no | UUID string, must reference an existing `organization_types.id` when present, or `null` to clear. **New (2026-08-26)** — not yet on `UpdateOrganizationDto`. |
| `items[].sortOrder` | no | non-negative integer |
| `items[].isActive` | no | boolean |

## Business Logic
1. Validate body.
2. For any row with `organizationTypeId` present and non-null, confirm it references an existing `OrganizationType`; if not, return `400 ORGANIZATION_TYPE_NOT_FOUND`.
3. Confirm every `id` exists. If any id is missing, return `404 ORGANIZATION_NOT_FOUND`.
4. Controller maps each item to `{ id, data: { ...fields, updatedByUserId } }` (existing behavior, unchanged — see `organization.controller.ts`'s `updateMany`).
5. Apply updates through inherited `BaseService.updateMany(items, actorUserId)`.
6. Return updated rows in the same order as request items.

## Database Interaction
- Inherited `BaseService.updateMany(items, actorUserId)`, delegating each item to `update(id, data, actorUserId)`.

## Event Behavior
- Emits one shared `entity.updated` event per updated row.
- `entityType`: `ORGANIZATION`
- `entityId`: updated row id, stringified
- `payload`: update data for that row, including `updatedByUserId`
- `actorUserId`: current user id

## Audit Log Behavior
- `AuditLogListener` maps the event to `ORGANIZATION_UPDATED` (existing action).

## Request Body
```json
{
  "items": [
    {
      "id": 3,
      "organizationTypeId": "7f53fb72-bbb8-4633-ae91-90f41c4b2a4e",
      "isActive": false
    }
  ]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Organizations updated successfully.",
  "data": [
    {
      "id": 3,
      "code": "ENG",
      "name": "Engineering",
      "description": null,
      "parentId": null,
      "type": "DEPARTMENT",
      "organizationTypeId": "7f53fb72-bbb8-4633-ae91-90f41c4b2a4e",
      "sortOrder": 0,
      "isActive": false,
      "createdAt": "2026-08-23T10:00:00.000Z",
      "updatedAt": "2026-08-26T10:30:00.000Z",
      "createdByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5",
      "updatedByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5"
    }
  ]
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
| `ORGANIZATION_NOT_FOUND` | 404 | At least one requested id does not exist |
| `ORGANIZATION_TYPE_NOT_FOUND` | 400 | At least one row's `organizationTypeId` does not reference an existing organization type |

## Frontend Contract Notes
- Mutation key: `['organizations', 'update-many']`.
- On success, invalidate `['organizations']`.
- `EditOrganizationModal` replaces its "Frontend Stage" local-only submit with this real mutation (single-item `items` array), and its Type field switches to a real `organizationTypeId` select sourced from `GET /api/organization-types`.

## Ambiguities
None.
