---
id: API-WORKFLOW-SOCKET
type: api
module: workflow
status: draft
depends_on:
  - WORK-029
---

# Workflow Socket Contract

Namespace: `/ws`.

Handshake auth:
- Client passes JWT as `handshake.auth.token`.
- Server verifies with the same RS256 public key used by HTTP auth.
- On successful connect, the socket resolves the actor's `Employee` and joins `employee:{employeeId}`.

Rooms:
- `employee:{employeeId}`
- `workflow-request:{requestId}`

Client messages:
- `workflow-request:subscribe` with `{ "requestId": "uuid" }`
- `workflow-request:unsubscribe` with `{ "requestId": "uuid" }`

The gateway re-verifies read authority before joining a request room. Unauthorized joins are refused silently. No global broadcast is allowed.

Workflow event payloads:

```json
{
  "workflowRequestId": "uuid",
  "workflowId": "uuid",
  "action": "APPROVE",
  "status": "IN_PROGRESS",
  "actorEmployeeId": "uuid",
  "previousStepId": "uuid | null",
  "currentStepId": "uuid | null",
  "occurredAt": "2026-08-28T10:00:00.000Z"
}
```

Event names:
- `workflow.request.created`
- `workflow.request.approved`
- `workflow.request.feedback`
- `workflow.request.rejected`
- `workflow.request.cancelled`
- `workflow.request.resubmitted`
- `workflow.request.completed`
- `notification.created`

Notification payload:

```json
{
  "notificationId": "uuid",
  "recipientEmployeeId": "uuid",
  "type": "WORKFLOW_REQUEST_APPROVED",
  "referenceId": "uuid",
  "occurredAt": "2026-08-28T10:00:00.000Z"
}
```
