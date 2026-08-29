---
id: API-WORKFLOW-REPLACE-STEPS
type: api
module: workflow
status: draft
depends_on:
  - DB-WORKFLOW-STEP
  - DB-ORGANIZATION-TYPE
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Replace Workflow Steps

## API
- Method: `POST`
- URL: `/api/workflows/:id/steps`
- Status: draft

## Purpose
Configure the approval chain. This is the mechanism that makes the workflow engine configurable: adding a Director and CEO level above Department Manager is a call to this endpoint, with no engine code change, no migration, and no redeploy.

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may configure a workflow's chain.

## DTO And Field Validation
DTO name: `ReplaceWorkflowStepsDto`

| Field | Required | Validation |
| --- | --- | --- |
| `steps` | yes | array, min `1`, max `20` (`MAX_CHAIN_LENGTH`) |
| `steps[].name` | yes | string, trim, max `255` |
| `steps[].organizationTypeId` | yes | UUID, must reference an existing `organization_types.id` |

**The client never sends `parentId`.** The DTO has no such field. The server derives the chain from array position, which is what makes a branching chain unrepresentable through the API and keeps the linked-list invariant true by construction.

`steps[].name` is a display label only. It is never read by any engine logic — authority comes from `organizationTypeId` alone, so renaming a step cannot change who may act.

## Business Logic
1. Confirm the workflow exists, else `404 WORKFLOW_NOT_FOUND`.
2. Confirm no non-terminal request references this workflow, else `409 WORKFLOW_HAS_ACTIVE_REQUESTS`.
3. Confirm every `organizationTypeId` exists, else `400 ORGANIZATION_TYPE_NOT_FOUND` with a granular path (`steps.0.organizationTypeId`).
4. In one transaction: delete the existing steps, insert the new chain, and increment `workflow.version`.
5. Return the workflow with its newly ordered chain.

### Why replace-and-not-patch
Rewiring a chain while a request is mid-flight would leave that request's `current_step_id` pointing at a deleted row. Refusing the operation whenever anything is in flight is what makes whole-chain replacement safe: it can only run when no request depends on the existing steps.

Non-terminal statuses for this check are `DRAFT`, `IN_PROGRESS`, and `NEEDS_REVISION`. Requests in `APPROVED`, `REJECTED`, or `CANCELLED` no longer reference a live step, so they do not block.

### Chain construction
```text
steps[0].parentId = null          stepOrder = 0
steps[1].parentId = steps[0].id   stepOrder = 1
steps[2].parentId = steps[1].id   stepOrder = 2
```
Inserts are sequential rather than a `createMany`, because each row needs the previous row's generated id as its `parentId`.

## Database Interaction
- `prisma.$transaction` covering `workflowStep.deleteMany`, sequential `workflowStep.create`, and `workflow.update` for the version bump.
- This is one of the two sanctioned `$transaction` uses in `WORK-028`: a multi-row atomic write that no single inherited `BaseService` method can express.

## Event Behavior
- None in this phase.

## Audit Log Behavior
- None. Workflow entities are excluded from the shared audit log.

## Request Body
```json
{
  "steps": [
    { "name": "Team Lead",          "organizationTypeId": "type-team" },
    { "name": "Manager",            "organizationTypeId": "type-division" },
    { "name": "Department Manager", "organizationTypeId": "type-department" }
  ]
}
```

## Common Response
Returns the same shape as `API-WORKFLOW-DETAIL`, with `steps[]` ordered root-first and `version` incremented.

## HTTP Status
- Success: `200 OK`
- Validation error: `400 Bad Request`
- Not found: `404 Not Found`
- Conflict: `409 Conflict`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body validation failed, including array size limits |
| `ORGANIZATION_TYPE_NOT_FOUND` | 400 | A step references an organization type that does not exist |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `WORKFLOW_NOT_FOUND` | 404 | No workflow with this id |
| `WORKFLOW_HAS_ACTIVE_REQUESTS` | 409 | A non-terminal request references this workflow |

## Frontend Contract Notes
- Mutation key: `['workflows', 'replace-steps']`.
- On success, invalidate `['workflows']` and `['workflows', id]`.
- `409 WORKFLOW_HAS_ACTIVE_REQUESTS` must be surfaced as a clear explanation — the chain cannot be changed while requests are in flight — not as a generic failure.

## Ambiguities
None.
