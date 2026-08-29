---
id: API-WORKFLOW-REQUEST-LIST
type: api
module: workflow
status: draft
depends_on:
  - DB-WORKFLOW-REQUEST
  - API-WORKFLOW-REQUEST-DETAIL
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# List Workflow Requests

## API
- Method: `GET`
- URL: `/api/workflow-requests`
- Status: draft

## Purpose
Powers two screens from one endpoint: **My Requests** (`scope=mine`) and **Reviewer Inbox** (`scope=inbox`).

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- Any authenticated user may call this endpoint. Both scopes are actor-relative, so an account with no linked `Employee` has nothing to return.
- **An unlinked account is not rejected.** `resolveActorEmployee` returns an empty object rather than throwing, so `actor.id` is `undefined`: `scope=mine` filters on `employeeId: undefined` and `scope=inbox` finds no matching organization, both yielding an empty list rather than an error. Recorded to match current implemented behaviour.

## DTO And Field Validation
DTO name: `GetWorkflowRequestsQueryDto`

| Field | Required | Validation |
| --- | --- | --- |
| `page` | no | positive integer, default `1` |
| `limit` | no | positive integer, default `10`, max `100` |
| `status` | no | one of the six `WorkflowRequestStatus` values |
| `workflowId` | no | UUID |
| `scope` | no | `mine` or `inbox`; default `mine` |

There is deliberately **no "all requests" scope** in this phase. Both available scopes are bounded by the actor, so no endpoint can enumerate other people's requests.

## Business Logic

### `scope=mine`
Requests where `employeeId` is the actor's employee id, filtered by the optional `status`/`workflowId`, ordered `createdAt` descending, paged in the database.

### `scope=inbox`
Non-terminal requests the actor may act on **right now**.

The authority rule depends on the requester's whole organization ancestry, which this query cannot express in SQL. Resolution is therefore two-stage:

1. **Narrow in the database** by the one condition that *is* expressible — the request is `IN_PROGRESS` and its `currentStep.organizationTypeId` equals the actor's own organization type. An actor whose organization has no type matches nothing and gets an empty page without querying further.
2. **Filter in memory** with the shared `canActAtStep` rule, which additionally requires the actor's organization to be an ancestor-or-self of the requester's.

Paging is applied **after** filtering, so a page is never short of eligible rows — slicing before the ancestry filter would return pages with arbitrary gaps.

## Database Interaction
- `prisma.workflowRequest.findMany(...)` / `.count(...)` with the relation include used by the detail endpoint.
- `prisma.organization.findMany(...)` once per call, to build the ancestry map.

## Event Behavior
- None. Read operation.

## Audit Log Behavior
- None.

## Common Response
```json
{
  "success": true,
  "message": "Workflow requests retrieved successfully.",
  "data": [],
  "meta": { "page": 1, "limit": 10, "total": 0 }
}
```

Each element of `data` is the **identical** `WorkflowRequest` object documented in `API-WORKFLOW-REQUEST-DETAIL`, including a per-actor `permissions` object.

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
- TanStack query key: `['workflow-requests', queryState]`.
- My Requests uses `scope=mine`; Reviewer Inbox uses `scope=inbox`.
- An empty inbox is a normal state: a step with no eligible actor legitimately stalls, and that is surfaced rather than auto-escalated.

## Ambiguities
- **An unlinked actor sees an empty list rather than an error** (see Authorization). This is indistinguishable from "you genuinely have no requests", so a user whose account is not yet linked to an `Employee` gets no signal explaining why both screens are empty. Recorded as implemented behaviour; surfacing that state would need a deliberate decision about which status/code to use.
