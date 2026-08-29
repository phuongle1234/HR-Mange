---
id: API-WORKFLOW-UPDATE
type: api
module: workflow
status: draft
depends_on:
  - DB-WORKFLOW
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Update Workflow

## API
- Method: `PUT`
- URL: `/api/workflows/:id`
- Status: draft

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may update a workflow definition.

## DTO And Field Validation
DTO name: `UpdateWorkflowDto`

| Field | Required | Validation |
| --- | --- | --- |
| `name` | no | string, trim, max `255` |
| `description` | no | string, trim |
| `formSchema` | no | object, validated by `@IsValidWorkflowFormSchema()` (rules in `API-WORKFLOW-CREATE`) |
| `status` | no | one of `DRAFT`, `ACTIVE`, `ARCHIVED` |

**`code` is absent from this DTO by design.** It is the stable business key and immutable after create; omitting the field is the enforcement, so there is nothing for a client to send.

Steps are not updated here — the chain has its own endpoint (`API-WORKFLOW-REPLACE-STEPS`) with its own in-flight-request safety check.

## Business Logic
1. Validate the body.
2. Build update data containing **only the fields actually present** in the DTO.
3. Call inherited `BaseService.update(id, data, actorUserId)`, which translates Prisma's `P2025` into `404 WORKFLOW_NOT_FOUND`.
4. Return the updated row.

Absent fields are omitted rather than defaulted. Sending a default for an omitted field would overwrite real data — the same rule the project applies to every bulk update mapping.

### Changing `status`
`DRAFT → ACTIVE` is how a workflow becomes submittable. `ACTIVE → ARCHIVED` retires it: existing requests continue through their chain, but no new request can be submitted (`400 WORKFLOW_NOT_ACTIVE`). No status transition is blocked by this endpoint, because the submit path already enforces the only rule that matters.

## Database Interaction
- Inherited `BaseService.update(id, data, actorUserId)` → `this.entity.update({ where: { id }, data })`.

## Event Behavior
- None. Workflow services are constructed with `entityType: null`.

## Audit Log Behavior
- None.

## Request Body
```json
{
  "name": "Đăng ký nghỉ phép",
  "description": "Leave request approval flow",
  "status": "ACTIVE"
}
```

## Common Response
Returns the updated workflow row, same shape as a row from `API-WORKFLOW-LIST` (no `steps[]`).

## HTTP Status
- Success: `200 OK`
- Validation error: `400 Bad Request`
- Not found: `404 Not Found`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body or `formSchema` validation failed |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `WORKFLOW_NOT_FOUND` | 404 | No workflow with this id |

## Frontend Contract Notes
- Mutation key: `['workflows', 'update']`.
- On success, invalidate `['workflows']` and `['workflows', id]`.
- The edit form must not offer `code` as an editable field.

## Ambiguities
Changing `formSchema` while requests already exist is permitted: existing `form_data` is untouched and continues to render from whatever it stored. Whether an in-flight request should be pinned to the schema version it was submitted under is out of scope for this phase — `version` exists but is informational only, and requests do not pin it.
