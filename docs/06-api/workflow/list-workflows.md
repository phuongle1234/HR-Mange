---
id: API-WORKFLOW-LIST
type: api
module: workflow
status: draft
depends_on:
  - DB-WORKFLOW
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# List Workflows

## API
- Method: `GET`
- URL: `/api/workflows`
- Status: draft

## Controller
- Controller: `WorkflowController`
- Function: `findMany(query)`
- Responsibility: validate the query DTO through the global validation pipe, call `IWorkflowService.findMany(query)`, return the common success envelope with pagination metadata.

## Service
- Interface: `IWorkflowService`
- Implementation: `WorkflowService`
- Base contract: `extends BaseService<PrismaService['workflow'], GetWorkflowsQueryDto>`
- Audit: constructed with `entityType: null` — workflow entities opt out of the shared audit log (see `DB-WORKFLOW-HISTORY`).

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may list workflow definitions.

## DTO And Field Validation
DTO name: `GetWorkflowsQueryDto`

| Field | Required | Validation |
| --- | --- | --- |
| `page` | no | positive integer, default `DEFAULT_PAGE` (`1`) |
| `limit` | no | positive integer, default `DEFAULT_PAGE_LIMIT` (`10`), max `MAX_PAGE_LIMIT` (`100`) |
| `search` | no | string, trimmed; matches `code`, `name`, and `description` case-insensitively |
| `status` | no | one of `DRAFT`, `ACTIVE`, `ARCHIVED` |
| `sortBy` | no | one of `code`, `name`, `status`, `createdAt`, `updatedAt`; default `createdAt` |
| `sortOrder` | no | `asc` or `desc`; default `desc` |

Defaults come from `common/constants/app.constants.ts` rather than literals, so paging limits stay consistent with every other list endpoint.

## Business Logic
1. Validate query params.
2. Build the Prisma `where` from `search` and `status`.
3. Apply `orderBy`, `skip`, and `take`.
4. Return rows plus pagination metadata.

## Database Interaction
- `this.entity.findMany({ where, orderBy, skip, take })`
- `this.entity.count({ where })`

## Event Behavior
- None. Read operation.

## Audit Log Behavior
- None. Reads are not audited, and workflow entities are excluded from the shared audit log entirely.

## Common Response
```json
{
  "success": true,
  "message": "Workflows retrieved successfully.",
  "data": [
    {
      "id": "3f2a1c4b-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
      "code": "LEAVE_REQUEST",
      "name": "Đăng ký nghỉ phép",
      "description": "Leave request approval flow",
      "formSchema": { "fields": [] },
      "status": "ACTIVE",
      "version": 2,
      "createdByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5",
      "createdAt": "2026-08-28T10:00:00.000Z",
      "updatedAt": "2026-08-28T10:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1 }
}
```

List rows do **not** include `steps`. The chain is only returned by `API-WORKFLOW-DETAIL`, because ordering it requires walking `parentId` per row and a list view has no use for it.

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
- TanStack query key: `['workflows', queryState]`.
- Only `ACTIVE` workflows may be submitted against, so the submit picker filters with `status=ACTIVE`.

## Ambiguities
None.
