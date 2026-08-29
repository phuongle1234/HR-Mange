---
id: API-WORKFLOW-REQUEST-DETAIL
type: api
module: workflow
status: draft
depends_on:
  - DB-WORKFLOW-REQUEST
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Get Workflow Request Detail

## API
- Method: `GET`
- URL: `/api/workflow-requests/:id`
- Status: draft

## Purpose
The canonical `WorkflowRequest` response shape. Every list row and all five of `WORK-029`'s action endpoints return this **identical** object — a divergence would silently break the frontend's cache updates, since it caches by these keys.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- Any authenticated user may read a request. Read access is deliberately not restricted in this phase; what an actor may *do* is expressed by the computed `permissions` object and enforced server-side on every action.

## Business Logic
1. Load the request with `workflow`, `employee`, and `currentStep` relations; missing ⇒ `404 WORKFLOW_REQUEST_NOT_FOUND`.
2. Resolve the calling actor's `Employee` (may be `null` if the account has none).
3. Load the organization tree and compute `permissions` for this actor.
4. Return the assembled response.

### `permissions`
Computed per requesting actor from the approver-resolution rule (`DB-WORKFLOW-STEP`, contract §4):

| Flag | True when |
| --- | --- |
| `canApprove` / `canFeedback` / `canReject` | status is `IN_PROGRESS` **and** the actor's organization has exactly `currentStep.organizationTypeId` **and** that organization is an ancestor-or-self of the requester's organization |
| `canCancel` | the actor is the requester and status is `IN_PROGRESS` or `NEEDS_REVISION` |
| `canResubmit` | the actor is the requester and status is `NEEDS_REVISION` |

All flags are `false` for a terminal request, and for an actor with no `Employee` record.

`permissions` is a **UX convenience only**. Hiding a button is never the security boundary — the action engine re-validates authority on every action regardless. The same exported function computes both this object and the engine's checks, so the two can never drift.

## Database Interaction
- `prisma.workflowRequest.findUnique({ where: { id }, include: { workflow, employee, currentStep } })`
- `prisma.employee.findUnique({ where: { userId } })`
- `prisma.organization.findMany({ select: { id, parentId, organizationTypeId } })` — the whole tree, keyed by id. Ancestry walking needs arbitrary ancestors, and the table is small and slow-changing, so one read beats a recursive query per request.

## Event Behavior
- None. Read operation.

## Audit Log Behavior
- None.

## Common Response
```json
{
  "success": true,
  "message": "Workflow request retrieved successfully.",
  "data": {
    "id": "req-001",
    "workflowId": "wf-001",
    "workflow": { "id": "wf-001", "code": "LEAVE_REQUEST", "name": "Đăng ký nghỉ phép" },
    "employeeId": "emp-001",
    "employee": {
      "id": "emp-001",
      "employeeCode": "EMP-001",
      "firstName": "Nguyen",
      "lastName": "Van A",
      "organizationId": 3
    },
    "currentStepId": "step-2",
    "currentStep": {
      "id": "step-2",
      "name": "Manager",
      "organizationTypeId": "type-division",
      "parentId": "step-1"
    },
    "status": "IN_PROGRESS",
    "formData": {
      "leaveType": "ANNUAL",
      "startDate": "2026-09-01",
      "endDate": "2026-09-03",
      "reason": "Nghỉ phép năm"
    },
    "revision": 3,
    "submittedAt": "2026-08-28T10:00:00.000Z",
    "completedAt": null,
    "createdAt": "2026-08-28T10:00:00.000Z",
    "updatedAt": "2026-08-28T11:00:00.000Z",
    "permissions": {
      "canApprove": true,
      "canFeedback": true,
      "canReject": true,
      "canCancel": false,
      "canResubmit": false
    }
  }
}
```

`currentStepId` is `null` **only** when the request is terminal. `revision` is the optimistic-lock token the client must echo back with every action.

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
- TanStack query key: `['workflow-requests', id]`.
- Action buttons are driven entirely by `permissions` — never by inferring from `status` or comparing ids client-side.
- Every action must send the `revision` from this response; a mismatch returns `409 WORKFLOW_REQUEST_STALE`.

## Ambiguities
None.
