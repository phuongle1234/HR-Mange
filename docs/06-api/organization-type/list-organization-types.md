---
id: API-ORGANIZATION-TYPE-LIST
type: api
module: organization-type
status: draft
depends_on:
  - DB-ORGANIZATION-TYPE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# List Organization Types

## API
- Method: `GET`
- URL: `/api/organization-types`
- Status: draft

## Controller
- Controller: `OrganizationTypeController`
- Function: `findAll(query, currentUser)`
- Responsibility:
  - Validate query DTO through NestJS validation pipe.
  - Call `IOrganizationTypeService.findMany(query)`.
  - Return a common success response with pagination metadata.

## Service
- Interface: `IOrganizationTypeService`
- Implementation: `OrganizationTypeService`
- Base contract: extends `BaseService<PrismaService['organizationType'], GetOrganizationTypesQueryDto>`
- Responsibility:
  - Map validated query to Prisma `where`, `orderBy`, `skip`, and `take`.
  - Search `name` and `description` case-insensitively.
  - Return `{ items, total }`.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may list organization types.

## DTO And Field Validation
DTO name: `GetOrganizationTypesQueryDto`

| Field | Required | Validation |
| --- | --- | --- |
| `page` | no | positive integer, default `1` |
| `limit` | no | positive integer, default `10`, max `100` |
| `search` | no | string, trim, searches `name` and `description` |
| `sortBy` | no | one of `name`, `createdAt`, `updatedAt`; default `createdAt` |
| `sortOrder` | no | `asc` or `desc`; default `desc` |

## Business Logic
1. Validate query params.
2. Build Prisma `where` from `search`.
3. Build Prisma `orderBy` from `sortBy` and `sortOrder`.
4. Apply pagination using `page` and `limit`.
5. Return safe DTO rows and pagination metadata.

## Database Interaction
- `this.entity.findMany({ where, orderBy, skip, take })`
- `this.entity.count({ where })`

## Event Behavior
- None. Read operation.

## Audit Log Behavior
- None. Reads are not audited.

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
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1
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
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |

## Frontend Contract Notes
- TanStack query key: `['organization-types', queryState]`.
- The frontend must use this endpoint for the list page table.
- Empty data with `total = 0` renders the shared empty state.

## Ambiguities
None.
