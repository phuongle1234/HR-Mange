---
id: API-WORKFLOW-REQUEST-SUBMIT
type: api
module: workflow
status: draft
depends_on:
  - DB-WORKFLOW-REQUEST
  - DB-WORKFLOW-HISTORY
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Submit Workflow Request

## API
- Method: `POST`
- URL: `/api/workflow-requests`
- Status: draft

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- Any authenticated user may call this endpoint. There is no permission check beyond `JwtAuthGuard`.

### Actor resolution when no `Employee` is linked
The actor is resolved from `@CurrentUser().id` via `employees.user_id`. **A `User` with no linked `Employee` is not rejected by the service** — `resolveActorEmployee` returns an empty object rather than throwing, so the request proceeds and `employeeId` reaches Prisma as `undefined`.

The write then fails at the database layer and surfaces as `500 INTERNAL_SERVER_ERROR` (Prisma reports the missing required `workflow`/`employee` relation), not as a domain error.

This is current implemented behaviour, recorded here so the spec matches the code rather than an intended design. Two consequences worth knowing before relying on this endpoint:
- The seeded `admin@employeeos.local` account has **no** `Employee` row (all existing employees have `user_id = null`), so submitting as that account currently produces a `500`.
- An account can only submit once its `User` is linked to an `Employee` — normally through the invitation-accept flow, which sets `employees.user_id`.

`WorkflowActionNotAllowedException` (`403`) remains defined and is still used by the action engine for authority failures; it is simply not raised by actor resolution here.

## DTO And Field Validation
DTO name: `CreateWorkflowRequestDto`

| Field | Required | Validation |
| --- | --- | --- |
| `workflowId` | yes | UUID |
| `formData` | yes | object; validated against the workflow's own `form_schema` |

`formData` cannot be validated by a decorator, because the rules live in the workflow row being submitted against and are only known after a database read. Validation therefore runs in the service through the shared `validateFormDataAgainstSchema`, which throws the standard `ValidationException` so the error envelope is identical to any DTO failure.

### `formData` rules
| Schema `type` | Accepted value |
| --- | --- |
| `text`, `textarea` | string |
| `number` | finite number — a numeric string such as `"5"` is rejected |
| `date` | `YYYY-MM-DD` string that is a real calendar date |
| `select` | string equal to one of that field's `options[].value` |
| `checkbox` | boolean |

- A `required` field must be present and not `null`/`""`.
- An optional field may be absent.
- A key not present in the schema is rejected — accepting it would silently persist data no form can ever display or edit again.
- Errors use granular paths: `formData.startDate`, `formData.leaveType`.

## Business Logic
Order matters, because each check depends on the previous one having passed:

1. Resolve the actor's `Employee` from `@CurrentUser().id` via `employees.user_id`. An unlinked account is not rejected here — see "Actor resolution when no `Employee` is linked" above.
2. Load the workflow with its steps; missing ⇒ `404 WORKFLOW_NOT_FOUND`.
3. Workflow must be `ACTIVE` ⇒ else `400 WORKFLOW_NOT_ACTIVE`.
4. Workflow must have at least one step ⇒ else `400 WORKFLOW_HAS_NO_STEPS`.
5. Validate `formData` against `form_schema`.
6. Find the root step (`parentId === null`).
7. In one transaction: insert the request (`IN_PROGRESS`, `currentStepId = root.id`, `submittedAt = now`, `revision = 0`) and its `SUBMIT` history row.
8. Return the request in the standard response shape.

The request and its history row are written together because a request with no history would have no record of who raised it.

The `SUBMIT` history row has `workflowStepId = null`: the requester acts at no step (see `DB-WORKFLOW-HISTORY`).

## Event Behavior
- **None in `WORK-028`.** `workflow.request.created` is emitted by `WORK-029`, which owns the event and gateway layer. A `// TODO(WORK-029)` marker sits at the exact post-commit line so integration is a one-line change.

## Audit Log Behavior
- None. The `SUBMIT` row in `workflow_histories` is the audit trail for this action.

## Request Body
```json
{
  "workflowId": "3f2a1c4b-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
  "formData": {
    "leaveType": "ANNUAL",
    "startDate": "2026-09-01",
    "endDate": "2026-09-03",
    "reason": "Nghỉ phép năm"
  }
}
```

## Common Response
Returns the standard `WorkflowRequest` response object — identical in shape to `API-WORKFLOW-REQUEST-DETAIL` and to all five of `WORK-029`'s action responses.

## HTTP Status
- Success: `201 Created`
- Validation error: `400 Bad Request`
- Server error (unlinked actor, see Authorization): `500 Internal Server Error`
- Not found: `404 Not Found`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body or `formData` validation failed |
| `WORKFLOW_NOT_ACTIVE` | 400 | The workflow is `DRAFT` or `ARCHIVED` |
| `WORKFLOW_HAS_NO_STEPS` | 400 | The workflow has no configured approval chain |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `INTERNAL_SERVER_ERROR` | 500 | The actor has no linked `Employee`, so `employeeId` reaches Prisma as `undefined` and the write fails |
| `WORKFLOW_NOT_FOUND` | 404 | No workflow with this id |

## Frontend Contract Notes
- Mutation key: `['workflow-requests', 'create']`.
- On success, invalidate `['workflow-requests']`.
- `formData.<key>` errors map directly onto the dynamic form's fields.

## Ambiguities
- **An unlinked actor produces `500`, not a domain error.** `resolveActorEmployee` deliberately does not throw (see Authorization), so the failure surfaces from Prisma rather than as a typed workflow error. This is recorded as implemented behaviour, not as a recommendation; if a clean `403` is wanted later, that is a one-line change in `resolveActorEmployee` plus a spec update here.
- **Data prerequisite for using this endpoint at all:** at least one `Employee` must have `user_id` set to the calling account's user id. As of 2026-08-29 no employee in the database has a `user_id`, so submitting currently fails for every account. The invitation-accept flow is what normally establishes that link.
