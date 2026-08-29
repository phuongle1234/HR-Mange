---
id: API-WORKFLOW-REQUEST-HISTORIES
type: api
module: workflow
status: draft
depends_on:
  - DB-WORKFLOW-HISTORY
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Get Workflow Request Histories

## API
- Method: `GET`
- URL: `/api/workflow-requests/:id/histories`
- Status: draft

## Purpose
The audit trail for one request, powering the detail page's timeline.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- Same as `API-WORKFLOW-REQUEST-DETAIL`: any authenticated user may read.

## Business Logic
1. Confirm the request exists — an unknown id must read as `404`, not as an empty list, so the client can distinguish "no history yet" from "no such request".
2. Load history rows with `workflowStep` and `employee` relations.
3. Order by `createdAt` **ascending**, so the timeline reads oldest-first in the order events actually happened.

**Read-only by design.** `workflow_histories` is insert-only; no update or delete endpoint exists for it, and none may be added (see `DB-WORKFLOW-HISTORY`). An editable audit trail is not an audit trail.

## Database Interaction
- `prisma.workflowHistory.findMany({ where: { workflowRequestId }, include: { workflowStep, employee }, orderBy: { createdAt: 'asc' } })`

## Event Behavior
- None. Read operation.

## Audit Log Behavior
- None. This endpoint *is* the audit read path for workflow activity.

## Common Response
```json
{
  "success": true,
  "message": "Workflow request histories retrieved successfully.",
  "data": [
    {
      "id": "hist-001",
      "workflowRequestId": "req-001",
      "workflowStepId": null,
      "step": null,
      "employeeId": "emp-001",
      "employee": {
        "id": "emp-001",
        "firstName": "Nguyen",
        "lastName": "Van A",
        "employeeCode": "EMP-001"
      },
      "action": "SUBMIT",
      "comment": null,
      "createdAt": "2026-08-28T10:00:00.000Z"
    },
    {
      "id": "hist-002",
      "workflowRequestId": "req-001",
      "workflowStepId": "step-1",
      "step": { "id": "step-1", "name": "Team Lead" },
      "employeeId": "emp-002",
      "employee": {
        "id": "emp-002",
        "firstName": "Tran",
        "lastName": "Thi B",
        "employeeCode": "EMP-002"
      },
      "action": "APPROVE",
      "comment": "Approved.",
      "createdAt": "2026-08-28T11:00:00.000Z"
    }
  ]
}
```

`workflowStepId` and `step` are `null` for `SUBMIT`, `RESUBMIT`, and `CANCEL`: those are performed by the requester, who occupies no step in the chain.

## HTTP Status
- Success: `200 OK`
- Not found: `404 Not Found`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `WORKFLOW_REQUEST_NOT_FOUND` | 404 | No request with this id |

## Frontend Contract Notes
- TanStack query key: `['workflow-requests', id, 'histories']`.
- Invalidated alongside the request itself after any action.
- Rendered oldest-first as a timeline; the `null` step on requester actions should render as the requester rather than as a missing value.

## Ambiguities
None.
