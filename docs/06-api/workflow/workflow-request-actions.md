---
id: API-WORKFLOW-REQUEST-ACTIONS
type: api
module: workflow
status: draft
depends_on:
  - WORK-029
---

# Workflow Request Actions

All endpoints require `JwtAuthGuard` and return `ResponseHelper.success(...)` with the same request object shape as `GET /api/workflow-requests/:id`, including recomputed `permissions`.

| Method | Path | Body |
| --- | --- | --- |
| `POST` | `/api/workflow-requests/:id/approve` | `{ "revision": number, "comment"?: string }` |
| `POST` | `/api/workflow-requests/:id/feedback` | `{ "revision": number, "comment": string }` |
| `POST` | `/api/workflow-requests/:id/reject` | `{ "revision": number, "comment": string }` |
| `POST` | `/api/workflow-requests/:id/cancel` | `{ "revision": number, "comment"?: string }` |
| `POST` | `/api/workflow-requests/:id/resubmit` | `{ "revision": number, "formData": object, "comment"?: string }` |

## Transaction Contract

The action service performs the whole write in one transaction:

```text
re-read request
guard status
guard authority
insert workflow history
conditional update workflow request with revision
insert notifications
commit
emit application events
```

No application event or socket message may be emitted before commit.

## Concurrency

The update uses optimistic locking:

```sql
WHERE id = :id AND revision = :expectedRevision
```

Zero rows affected returns `409 WORKFLOW_REQUEST_STALE`.

## Errors

| Code | Status | Meaning |
| --- | --- | --- |
| `WORKFLOW_REQUEST_NOT_FOUND` | 404 | Request does not exist. |
| `WORKFLOW_REQUEST_INVALID_STATE` | 409 | Current status does not allow the requested action. |
| `WORKFLOW_ACTION_NOT_ALLOWED` | 403 | Actor is not allowed to perform the action. |
| `WORKFLOW_REQUEST_STALE` | 409 | Submitted revision is stale. |
| `VALIDATION_ERROR` | 400 | DTO validation failed or `resubmit.formData` failed workflow schema validation. |
