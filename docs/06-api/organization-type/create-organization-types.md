---
id: API-ORGANIZATION-TYPE-CREATE-MANY
type: api
module: organization-type
status: draft
depends_on:
  - DB-ORGANIZATION-TYPE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Create Organization Types

## API
- Method: `POST`
- URL: `/api/organization-types`
- Status: draft

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may create organization types.

## DTO And Field Validation
DTO name: `CreateOrganizationTypesDto`

| Field | Required | Validation |
| --- | --- | --- |
| `items` | yes | array, min `1`, max `100` |
| `items[].name` | yes | string, trim, max `100`, unique within request and unique in database |
| `items[].description` | no | string, trim, max `1000`, empty string normalized to `null` |

## Business Logic
1. Validate body.
2. Reject duplicate `name` values inside the request with `VALIDATION_ERROR`.
3. Controller maps each item to complete Prisma create data by adding `createdByUserId` and `updatedByUserId` from the current user.
4. Service calls inherited `createMany(dataArray, actorUserId)`.
5. On database unique conflict for `name`, return `409 ORGANIZATION_TYPE_NAME_EXISTS`.
6. Return created rows.

## Database Interaction
- Inherited `BaseService.createMany(dataArray, actorUserId)`.
- Expected Prisma operation: `createManyAndReturn({ data })`.

## Event Behavior
- Emits one shared `entity.created` event per created row.
- `entityType`: `ORGANIZATION_TYPE`
- `entityId`: created row id as string
- `payload`: original create data passed to `BaseService.createMany`
- `actorUserId`: current user id

## Audit Log Behavior
- `AuditLogListener` maps the event to `ORGANIZATION_TYPE_CREATED`.
- Audit payload contains the original create data, including `name`, `description`, `createdByUserId`, and `updatedByUserId`.

## Request Body
```json
{
  "items": [
    {
      "name": "Department",
      "description": "Functional department"
    },
    {
      "name": "Team",
      "description": null
    }
  ]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Organization types created successfully.",
  "data": [
    {
      "id": "7f53fb72-bbb8-4633-ae91-90f41c4b2a4e",
      "name": "Department",
      "description": "Functional department",
      "createdAt": "2026-08-24T10:00:00.000Z",
      "updatedAt": "2026-08-24T10:00:00.000Z",
      "createdByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5",
      "updatedByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5"
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
| `VALIDATION_ERROR` | 400 | Body validation failed, including duplicate names inside the request |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `ORGANIZATION_TYPE_NAME_EXISTS` | 409 | At least one name already exists in database |

## Frontend Contract Notes
- Mutation key: `['organization-types', 'create-many']`.
- On success, invalidate `['organization-types']`.
- Create page redirects to `/organizations/types`.
- Field errors for `items[n].name` must be mapped to the corresponding table row input.

## Ambiguities
None.
