---
id: API-WORKFLOW-CREATE
type: api
module: workflow
status: draft
depends_on:
  - DB-WORKFLOW
  - API-CONVENTIONS
  - API-ERROR-RESPONSE
---

# Create Workflow

## API
- Method: `POST`
- URL: `/api/workflows`
- Status: draft

## Authentication
- Required: yes
- Header: `Authorization: Bearer {{access_token}}`

## Authorization
- No permission check. Any authenticated user may create a workflow definition.

## DTO And Field Validation
DTO name: `CreateWorkflowDto`

| Field | Required | Validation |
| --- | --- | --- |
| `code` | yes | string, trim, max `50`, unique in database |
| `name` | yes | string, trim, max `255` |
| `description` | no | string, trim |
| `formSchema` | yes | object, validated by `@IsValidWorkflowFormSchema()` (see below) |
| `status` | no | one of `DRAFT`, `ACTIVE`, `ARCHIVED`; database default `DRAFT` |

### `formSchema` validation
Enforced by the reusable DTO validator `IsValidWorkflowFormSchemaConstraint`, never in the controller:

- Root object accepts only `fields`; any other property is rejected.
- `fields` must be a non-empty array.
- Per field: `key` required, unique within the schema, matching `^[a-zA-Z][a-zA-Z0-9_]*$`; `label` required and non-empty; `type` one of `text`, `textarea`, `number`, `date`, `select`, `checkbox`; `required` optional boolean.
- `options` is required and non-empty **only** when `type === "select"`, and forbidden otherwise. Each option needs a non-empty `label` and `value`, and `value` must be unique within the field.
- Unknown field properties are rejected.

Field errors use granular dot paths, e.g. `formSchema.fields.0.options`, `formSchema.fields.2.key`.

## Business Logic
1. Validate the body.
2. Reject a duplicate `code` with `409 WORKFLOW_CODE_EXISTS` (checked before the write so the client gets the domain error rather than a raw Prisma unique-constraint failure).
3. Controller maps the DTO to Prisma create data, adding `createdByUserId` from the current user.
4. Service calls inherited `BaseService.create(data, actorUserId)`.
5. Return the created row.

A newly created workflow has **no steps**. The chain is configured separately through `API-WORKFLOW-REPLACE-STEPS`, and a workflow with no steps cannot accept requests (`400 WORKFLOW_HAS_NO_STEPS`).

## Database Interaction
- Inherited `BaseService.create(data, actorUserId)` → `this.entity.create({ data })`.

## Event Behavior
- None. Workflow services are constructed with `entityType: null`, so no `entity.created` event is emitted.

## Audit Log Behavior
- None. Workflow activity is recorded in `workflow_histories` instead of the shared audit log (see `DB-WORKFLOW-HISTORY`).

## Request Body
```json
{
  "code": "LEAVE_REQUEST",
  "name": "Đăng ký nghỉ phép",
  "description": "Leave request approval flow",
  "formSchema": {
    "fields": [
      {
        "key": "leaveType",
        "label": "Loại nghỉ phép",
        "type": "select",
        "required": true,
        "options": [
          { "label": "Nghỉ phép năm", "value": "ANNUAL" },
          { "label": "Nghỉ bệnh", "value": "SICK" }
        ]
      },
      { "key": "startDate", "label": "Ngày bắt đầu", "type": "date", "required": true },
      { "key": "endDate", "label": "Ngày kết thúc", "type": "date", "required": true },
      { "key": "reason", "label": "Lý do", "type": "textarea", "required": true }
    ]
  }
}
```

## Common Response
```json
{
  "success": true,
  "message": "Workflow created successfully.",
  "data": {
    "id": "3f2a1c4b-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "code": "LEAVE_REQUEST",
    "name": "Đăng ký nghỉ phép",
    "description": "Leave request approval flow",
    "formSchema": { "fields": [] },
    "status": "DRAFT",
    "version": 1,
    "createdByUserId": "0d35f9cf-0242-4c5d-9d9f-cb47c5c245e5",
    "createdAt": "2026-08-28T10:00:00.000Z",
    "updatedAt": "2026-08-28T10:00:00.000Z"
  }
}
```

## HTTP Status
- Success: `201 Created`
- Validation error: `400 Bad Request`
- Conflict: `409 Conflict`
- Unauthorized: `401 Unauthorized`

## Error Codes And Error Responses
| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body or `formSchema` validation failed |
| `UNAUTHORIZED` | 401 | Access token missing, invalid, or expired |
| `WORKFLOW_CODE_EXISTS` | 409 | A workflow with this `code` already exists |

## Frontend Contract Notes
- Mutation key: `['workflows', 'create']`.
- On success, invalidate `['workflows']`.
- `formSchema.fields.<n>.<field>` errors map onto the corresponding builder row.

## Ambiguities
None.
