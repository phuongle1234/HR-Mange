---
id: API-ORGANIZATION-LIST
type: api
module: organization
status: draft
depends_on:
  - DB-ORGANIZATION
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# List Organizations

## API
- Method: `GET`
- URL: `/api/organizations`
- Status: draft

## Purpose
Document the Organization list endpoint that already exists in `backend/src/modules/organization` but was never written up under `docs/06-api/` (a recorded, deliberate gap per `docs/09-workflow/plans/organization-module-bulk-crud.md`). This file closes that gap and is also the contract the frontend agent wires the org-chart screen's real `services/organization.api.ts` against (`FRONTEND-ORGANIZATION-CHART`'s "Known Gaps").

## Controller
- Controller: `OrganizationController`
- Function: `findMany(query, currentUser)`
- Responsibility: validate query DTO, call `IOrganizationService.findMany(query)`, return a common success response with `total` in `meta`.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may list organizations.

## DTO And Field Validation
DTO name: `OrganizationFilterDto`

| Field | Required | Validation |
| --- | --- | --- |
| `parentId` | no | integer |
| `type` | no | one of `COMPANY`, `BRANCH`, `DIVISION`, `DEPARTMENT`, `TEAM` |
| `isActive` | no | boolean (`'true'`/`'false'` query strings are mapped explicitly, not via the `Boolean()` constructor) |
| `organizationTypeId` | no | UUID string. **New (2026-08-26)**, not yet implemented in the current controller — required alongside the `organizationTypeId` column (`DB-ORGANIZATION`). |

There is **no pagination** on this endpoint (`page`/`limit` are not accepted) — the org-chart screen loads the full tree/list at once, unlike the paginated Employee/OrganizationType lists. This is existing, intentional behavior, not a gap.

## Business Logic
1. Validate query params.
2. Build Prisma `where` from `parentId`/`type`/`isActive`/`organizationTypeId`.
3. Return all matching rows (no `skip`/`take`).

## Database Interaction
- `this.entity.findMany({ where })`
- `this.entity.count({ where })` for the `total` meta value.

## Event Behavior
- None. Read operation.

## Audit Log Behavior
- None. Reads are not audited.

## Common Response
```json
{
  "success": true,
  "message": "Organizations retrieved successfully.",
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
      "createdAt": "2026-08-23T10:00:00.000Z",
      "updatedAt": "2026-08-23T10:00:00.000Z",
      "createdByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5",
      "updatedByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

Note `id` is a **number** (`int4`), not a UUID string, per `DB-ORGANIZATION`'s recorded PK deviation — the frontend must not assume string ids for this entity the way it does for `Employee`/`OrganizationType`.

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
- TanStack query key: `['organizations', queryState]`.
- This is the endpoint `FRONTEND-ORGANIZATION-CHART` must wire its stub `services/organization.api.ts#getTree` against, replacing the "Frontend Stage" local-only data with a real `useQuery`.
- The Employee bulk table editor's Organization `react-select` column loads its options from this endpoint once per page load, with no filter (`FRONTEND-EMPLOYEE-CREATE`/`FRONTEND-EMPLOYEE-EDIT`), and maps `{ id, name }` rows to `{ value: id, label: name }`.

## Ambiguities
None blocking. `organizationTypeId` as a filter param is new and not yet implemented in the current controller — flagged as part of this contract, to be added by the backend agent alongside the schema change.
