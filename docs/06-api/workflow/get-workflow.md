---
id: API-WORKFLOW-DETAIL
type: api
module: workflow
status: draft
depends_on:
  - DB-WORKFLOW
  - DB-WORKFLOW-STEP
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Get Workflow Detail

## API
- Method: `GET`
- URL: `/api/workflows/:id`
- Status: draft

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may read a workflow definition.

## Business Logic
1. Load the workflow with its steps.
2. If it does not exist, return `404 WORKFLOW_NOT_FOUND`.
3. Order the steps **root-first by walking `parentId`** — never by `stepOrder`.
4. Return the workflow with the ordered chain.

### Step ordering
`orderStepChain` starts at the root (`parentId === null`) and follows child links. `stepOrder` is display/tiebreak data only and is deliberately not the ordering source: two sources of order would eventually disagree, and the engine's next/previous-step logic reads `parentId` exclusively.

The walk is bounded by `MAX_CHAIN_LENGTH` (20) and a visited set, because the database permits a cyclic `parentId`. Any step not reachable from the root is appended afterwards ordered by `stepOrder`, rather than dropped — silently hiding an orphaned step would make a misconfigured chain look correct in the UI.

## Database Interaction
- `prisma.workflow.findUnique({ where: { id }, include: { steps: true } })`

## Event Behavior
- None. Read operation.

## Audit Log Behavior
- None.

## Common Response
```json
{
  "success": true,
  "message": "Workflow retrieved successfully.",
  "data": {
    "id": "3f2a1c4b-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "code": "LEAVE_REQUEST",
    "name": "Đăng ký nghỉ phép",
    "description": "Leave request approval flow",
    "formSchema": { "fields": [] },
    "status": "ACTIVE",
    "version": 2,
    "createdByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5",
    "createdAt": "2026-08-28T10:00:00.000Z",
    "updatedAt": "2026-08-28T10:30:00.000Z",
    "steps": [
      {
        "id": "step-1",
        "workflowId": "3f2a1c4b-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
        "parentId": null,
        "name": "Team Lead",
        "organizationTypeId": "type-team",
        "stepOrder": 0,
        "createdAt": "2026-08-28T10:10:00.000Z",
        "updatedAt": "2026-08-28T10:10:00.000Z"
      },
      {
        "id": "step-2",
        "workflowId": "3f2a1c4b-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
        "parentId": "step-1",
        "name": "Manager",
        "organizationTypeId": "type-division",
        "stepOrder": 1,
        "createdAt": "2026-08-28T10:10:00.000Z",
        "updatedAt": "2026-08-28T10:10:00.000Z"
      }
    ]
  }
}
```

`steps[]` is always ordered root-first, so the frontend can render the chain and derive React Flow edges from `parentId` without re-sorting.

## HTTP Status
- Success: `200 OK`
- Not found: `404 Not Found`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `WORKFLOW_NOT_FOUND` | 404 | No workflow with this id |

## Frontend Contract Notes
- TanStack query key: `['workflows', id]`.
- The step builder and React Flow preview both read `steps[]` from this response.
- Edges are derived client-side from `parentId`; node coordinates are computed by dagre and never persisted.

## Ambiguities
None.
