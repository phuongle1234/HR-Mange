---
id: API-ORGANIZATION-TYPE-BY-IDS
type: api
module: organization-type
status: draft
depends_on:
  - DB-ORGANIZATION-TYPE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Get Organization Types By IDs

## API
- Method: `POST`
- URL: `/api/organization-types/by-ids`
- Status: draft

## Purpose
Fetch checked organization type rows for the bulk update page. This endpoint exists so the frontend can pass many ids in a JSON body without relying on URL array encoding or URL length limits.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may fetch organization types by ids.

## DTO And Field Validation
DTO name: `GetOrganizationTypesByIdsDto`

| Field | Required | Validation |
| --- | --- | --- |
| `ids` | yes | array of UUID strings, min `1`, max `100`, no duplicate ids |

## Business Logic
1. Validate body.
2. Call `IOrganizationTypeService.findByIds(ids)`.
3. Preserve the same order as the incoming `ids` array for returned rows that exist.
4. If one or more ids do not exist, return `404 ORGANIZATION_TYPE_NOT_FOUND`.
5. Return safe DTO rows.

## Database Interaction
- Inherited `BaseService.findByIds(ids)`.
- Expected Prisma operation: `findMany({ where: { id: { in: ids } } })`.

## Event Behavior
- None. Read operation.

## Audit Log Behavior
- None. Reads are not audited.

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
  "message": "Organization types retrieved successfully.",
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
- TanStack query key: `['organization-types', 'by-ids', ids]`.
- The update page must call this endpoint once after reading checked ids from Redux.
- If `ORGANIZATION_TYPE_NOT_FOUND` is returned, show a page-level error and offer navigation back to the list.

## Ambiguities
None.
