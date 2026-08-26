---
id: API-ORGANIZATION-CREATE-MANY
type: api
module: organization
status: draft
depends_on:
  - DB-ORGANIZATION
  - DB-ORGANIZATION-TYPE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Create Organizations

## API
- Method: `POST`
- URL: `/api/organizations`
- Status: draft

## Purpose
Document the existing bulk-create endpoint (`backend/src/modules/organization/controller/organization.controller.ts`) and extend its contract with the new `organizationTypeId` field so the frontend can wire the real Create modal (`FRONTEND-ORGANIZATION-CHART`'s `CreateOrganizationModal`) against it instead of the local "Frontend Stage" stub.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may create organizations.

## DTO And Field Validation
DTO name: `CreateOrganizationsDto`

| Field | Required | Validation |
| --- | --- | --- |
| `items` | yes | array, min `1` |
| `items[].code` | yes | string, trim, max `50`, unique in database |
| `items[].name` | yes | string, trim, max `255` |
| `items[].description` | no | string |
| `items[].parentId` | no | integer, must reference an existing `organizations.id` when present |
| `items[].type` | no | one of `COMPANY`, `BRANCH`, `DIVISION`, `DEPARTMENT`, `TEAM`; default `DEPARTMENT` |
| `items[].organizationTypeId` | no | UUID string, must reference an existing `organization_types.id` when present. **New (2026-08-26)** — not yet on `CreateOrganizationDto`. |
| `items[].sortOrder` | no | non-negative integer; default `0` |
| `items[].isActive` | no | boolean; default `true` |

There is currently no request-side cap on `items.length` (unlike Employee/OrganizationType bulk endpoints, which cap at 100) — this matches the existing implementation. Adding a max-size cap here is out of scope for this contract; flagged as a possible future hardening item, not a silent gap.

## Business Logic
1. Validate body.
2. For any row with `organizationTypeId` present, confirm it references an existing `OrganizationType`; if not, return `400 ORGANIZATION_TYPE_NOT_FOUND`.
3. Controller maps each item to complete Prisma create data by adding `createdByUserId` and `updatedByUserId` from the current user (existing behavior, unchanged).
4. Service calls inherited `createMany(items, user.id)`.
5. On database unique conflict for `code`, the current implementation surfaces the raw Prisma `P2002` error rather than a clean `409` — this is a pre-existing, recorded gap (`DB-ORGANIZATION`'s Ambiguities: "Whether `code` uniqueness conflicts during bulk `createMany`/`updateMany` should map to a clean 409 error... is not yet decided"). Not fixed as part of this contract; the backend agent may close it as a small, explicitly-scoped follow-up but it is not required for this daily task's acceptance criteria.
6. Return created rows.

## Database Interaction
- Inherited `BaseService.createMany(dataArray, actorUserId)`.
- Expected Prisma operation: `createManyAndReturn({ data })`.

## Event Behavior
- Emits one shared `entity.created` event per created row.
- `entityType`: `ORGANIZATION`
- `entityId`: created row id, stringified (`Organization.id` is `int4` — `BaseService`'s `idOf` helper handles this, see `DB-ORGANIZATION`'s "Deviation from DB-CONVENTIONS").
- `payload`: original create data
- `actorUserId`: current user id

## Audit Log Behavior
- `AuditLogListener` maps the event to `ORGANIZATION_CREATED` (existing action).

## Request Body
```json
{
  "items": [
    {
      "code": "ENG",
      "name": "Engineering",
      "parentId": null,
      "type": "DEPARTMENT",
      "organizationTypeId": "7f53fb72-bbb8-4633-ae91-90f41c4b2a4e"
    }
  ]
}
```

## Common Response
```json
{
  "success": true,
  "message": "Organizations created successfully.",
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
      "isActive": true,
      "createdAt": "2026-08-26T10:00:00.000Z",
      "updatedAt": "2026-08-26T10:00:00.000Z",
      "createdByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5",
      "updatedByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5"
    }
  ]
}
```

## HTTP Status
- Success: `201 Created`
- Validation error: `400 Bad Request`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body validation failed |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `ORGANIZATION_TYPE_NOT_FOUND` | 400 | At least one row's `organizationTypeId` does not reference an existing organization type |

## Frontend Contract Notes
- Mutation key: `['organizations', 'create-many']`.
- On success, invalidate `['organizations']`.
- `CreateOrganizationModal` (`FRONTEND-ORGANIZATION-CHART`) replaces its "Frontend Stage" local-only submit with this real mutation, and its Type field switches from the hardcoded `OrganizationType` union select to a real `organizationTypeId` select sourced from `GET /api/organization-types`.

## Ambiguities
None new. Carries forward `DB-ORGANIZATION`'s existing, pre-recorded ambiguity about `code` conflict handling (see Business Logic step 5).
