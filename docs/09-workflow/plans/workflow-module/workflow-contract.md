# Workflow Module — Shared Contract (FROZEN)

> Work item: `WORK-027`. Bound by `WORK-028` (Agent 1), `WORK-029` (Agent 2), `WORK-030` (Agent 3).
>
> **This file is frozen.** Agent 1, Agent 2, and Agent 3 all bind to it. No agent may change any enum value, field name, route, payload key, or error code here on its own. A change requires the Tech Lead to amend this file first; agents then re-read it. If something needed is missing, an agent records the gap in its final report and asks — it must **not** invent a value.
>
> Authority order (per the task brief §35): current repo code/schema → business rules in this contract → existing project conventions → engineering judgment.

---

## 1. Enums

These values are the wire format, the database format, and the TypeScript format. Same casing everywhere. No aliases, no translations in the payload.

### 1.1 `WorkflowStatus` (workflow definition lifecycle)
```
DRAFT
ACTIVE
ARCHIVED
```
Only `ACTIVE` workflows accept new requests. `DRAFT` is editable; `ARCHIVED` is read-only and hidden from the submit picker.

### 1.2 `WorkflowRequestStatus`
```
DRAFT
IN_PROGRESS
NEEDS_REVISION
APPROVED
REJECTED
CANCELLED
```

Terminal statuses: `APPROVED`, `REJECTED`, `CANCELLED`. Once terminal, no action is accepted (returns `409`).

`DRAFT` is reserved: the contract defines it so the enum is stable, but **no endpoint in this phase creates a `DRAFT` request** — `POST /api/workflow-requests` goes straight to `IN_PROGRESS`. Do not build save-as-draft UI or logic.

### 1.3 `WorkflowAction` (history action)
```
SUBMIT
RESUBMIT
REVIEW
APPROVE
FEEDBACK
REJECT
CANCEL
```

`REVIEW` is reserved for a future "viewed without deciding" record. No endpoint writes it in this phase. Defined here so the enum never has to change later.

### 1.4 `NotificationType`
```
WORKFLOW_REQUEST_SUBMITTED
WORKFLOW_REQUEST_APPROVED
WORKFLOW_REQUEST_FEEDBACK
WORKFLOW_REQUEST_REJECTED
WORKFLOW_REQUEST_COMPLETED
WORKFLOW_REQUEST_CANCELLED
```

### 1.5 `WorkflowFormFieldType` (form_schema field types)
```
text
textarea
number
date
select
checkbox
```
Lower-case, because these are JSON schema values consumed directly by the frontend renderer, not database enums. The set is closed: Agent 3 renders exactly these six and Agent 1 validates exactly these six. Adding a type is a contract amendment.

---

## 2. Database Entities

Prisma model names are PascalCase singular; table names are snake_case plural via `@@map`, matching every existing model in `backend/prisma/schema.prisma`.

**Four workflow tables only** (per brief §2). Notification adds one more table, owned by Agent 2.

### 2.1 `Workflow` → `workflows`
| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK, `@default(uuid())` | |
| `code` | `String` | `@unique`, `@db.VarChar(50)` | Stable business key, e.g. `LEAVE_REQUEST`. |
| `name` | `String` | `@db.VarChar(255)` | |
| `description` | `String?` | `@db.Text` | |
| `formSchema` | `Json` | `@map("form_schema")` | See §3. |
| `status` | `WorkflowStatus` | `@default(DRAFT)` | |
| `version` | `Int` | `@default(1)` | Incremented by Agent 1 on step/schema change. Informational; requests do **not** pin a version in this phase. |
| `createdByUserId` | `String?` | `@map("created_by_user_id")` | FK → `users.id`, matching existing audit-actor convention. |
| `createdAt` / `updatedAt` | `DateTime` | `@default(now())` / `@updatedAt` | |

Indexes: `code` (unique), `status`.

### 2.2 `WorkflowStep` → `workflow_steps`
| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK, `@default(uuid())` | |
| `workflowId` | `String` | `@map("workflow_id")`, FK → `workflows.id`, `onDelete: Cascade` | |
| `parentId` | `String?` | `@map("parent_id")`, self-FK → `workflow_steps.id`, `onDelete: Cascade` | `null` = root step (first approver). |
| `name` | `String` | `@db.VarChar(255)` | Display label, e.g. `Team Lead`. **Never** used for logic. |
| `organizationTypeId` | `String` | `@map("organization_type_id")`, FK → `organization_types.id`, `onDelete: Restrict` | Who may act. Required. |
| `stepOrder` | `Int` | `@map("step_order")` | Display/tiebreak ordering only. The chain is defined by `parentId`, **not** by this field. |
| `createdAt` / `updatedAt` | `DateTime` | | |

Indexes: `workflowId`, `parentId`, `organizationTypeId`.

**Forbidden fields** (brief §2.2, §43): no `x_position`, `y_position`, `config_json`, `allow_reject`, `allow_feedback`, `is_required`. React Flow positions are computed client-side by dagre, exactly as `frontend/src/features/organization/utils/organization-layout.ts` already does for the org chart.

**Chain shape is a linked list, not a tree.** Each step has at most one child. This is an invariant Agent 1 must enforce on write (see §7.3), because the whole engine depends on "the next step" being unambiguous.

### 2.3 `WorkflowRequest` → `workflow_requests`
| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK, `@default(uuid())` | |
| `workflowId` | `String` | `@map("workflow_id")`, FK → `workflows.id`, `onDelete: Restrict` | |
| `employeeId` | `String` | `@map("employee_id")`, FK → `employees.id`, `onDelete: Restrict` | The requester. |
| `currentStepId` | `String?` | `@map("current_step_id")`, FK → `workflow_steps.id`, `onDelete: Restrict` | `null` only when terminal. |
| `status` | `WorkflowRequestStatus` | `@default(IN_PROGRESS)` | |
| `formData` | `Json` | `@map("form_data")` | Values the employee entered. |
| `revision` | `Int` | `@default(0)` | **Optimistic-lock token.** See §8. |
| `submittedAt` | `DateTime?` | `@map("submitted_at")` | |
| `completedAt` | `DateTime?` | `@map("completed_at")` | Set on `APPROVED`/`REJECTED`/`CANCELLED`. |
| `createdAt` / `updatedAt` | `DateTime` | | |

Indexes: `employeeId`, `currentStepId`, `status`, `workflowId`.

> `revision` is **not** in the brief's field list. It is added deliberately: brief §33 requires that two concurrent APPROVEs cannot both succeed, and there is no way to satisfy that safely without a version token or `SELECT … FOR UPDATE`. A single `Int` column is the smaller, more portable change. Recorded here as a Tech Lead decision, not an agent's discretion.

### 2.4 `WorkflowHistory` → `workflow_histories`
| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK, `@default(uuid())` | |
| `workflowRequestId` | `String` | `@map("workflow_request_id")`, FK → `workflow_requests.id`, `onDelete: Cascade` | |
| `workflowStepId` | `String?` | `@map("workflow_step_id")`, FK → `workflow_steps.id`, `onDelete: Restrict` | Step the action happened **at**. `null` for `SUBMIT`/`RESUBMIT`/`CANCEL` by the requester, who acts at no step. |
| `employeeId` | `String` | `@map("employee_id")`, FK → `employees.id`, `onDelete: Restrict` | The actor. |
| `action` | `WorkflowAction` | | |
| `comment` | `String?` | `@db.Text` | Required for `FEEDBACK`/`REJECT` at the DTO level (§5), nullable in the DB so old rows stay valid. |
| `createdAt` | `DateTime` | `@default(now())` | |

Indexes: `workflowRequestId`, `(workflowRequestId, createdAt)`.

**Immutable** (brief §2.5): insert-only. No update or delete endpoint, ever. Agent 2 must not expose one.

### 2.5 `Notification` → `notifications` (Agent 2)
| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK, `@default(uuid())` | |
| `recipientEmployeeId` | `String` | `@map("recipient_employee_id")`, FK → `employees.id`, `onDelete: Cascade` | |
| `type` | `NotificationType` | | |
| `title` | `String` | `@db.VarChar(255)` | |
| `message` | `String` | `@db.Text` | |
| `referenceId` | `String?` | `@map("reference_id")` | The `workflowRequestId`. Intentionally a plain string, not an FK — notifications must survive as a generic feature for future non-workflow sources. |
| `isRead` | `Boolean` | `@default(false)`, `@map("is_read")` | |
| `createdAt` | `DateTime` | `@default(now())` | |

Indexes: `recipientEmployeeId`, `(recipientEmployeeId, isRead)`.

---

## 3. `form_schema` and `form_data`

Two different things, per brief §2.1:
- **`form_schema`** (on `Workflow`) — which fields the form has. Authored by an admin.
- **`form_data`** (on `WorkflowRequest`) — what the employee typed. Validated against the schema.

### 3.1 `form_schema` shape (FROZEN)
```json
{
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
```

Field object rules:
- `key` — required, unique within the schema, `^[a-zA-Z][a-zA-Z0-9_]*$`. Becomes the `form_data` key.
- `label` — required, non-empty.
- `type` — required, one of §1.5.
- `required` — optional boolean, default `false`.
- `options` — required and non-empty **only** when `type === "select"`; forbidden otherwise. Each `{ label, value }`, both non-empty strings, `value` unique.
- No other properties are permitted. Unknown properties are a `400`.

### 3.2 `form_data` shape
Flat object keyed by field `key`:
```json
{ "leaveType": "ANNUAL", "startDate": "2026-09-01", "endDate": "2026-09-03", "reason": "Nghỉ phép năm" }
```

Validation rules (Agent 1 owns the validator; Agent 2 reuses it verbatim for `RESUBMIT`):
| Schema type | Accepted `form_data` value |
|---|---|
| `text`, `textarea` | string |
| `number` | finite number (not a numeric string) |
| `date` | `YYYY-MM-DD` string |
| `select` | string equal to one of that field's `options[].value` |
| `checkbox` | boolean |

- `required: true` → key must be present and not `null`/`""`.
- `required: false` and absent → allowed.
- A key in `form_data` that is not in the schema → `400`.
- Field errors use the same granular path convention already in this repo (`docs/06-api/error-response.md` → "Bulk Endpoint Field Error Paths"): path is `formData.<key>`, e.g. `{"fieldErrors": {"formData.startDate": ["Must be a YYYY-MM-DD date."]}}`.

---

## 4. Approver Resolution — the engine's one hard problem

**Read this before writing any permission code.** Repo inspection finding: there is **no manager, head, or lead field anywhere** — not on `Employee`, not on `Organization`. So "who is this employee's Team Lead" cannot be answered by looking up a person. Approval authority is therefore **organization-scoped, not person-scoped**.

### 4.1 The rule
An actor may act on a request at `currentStep` when **all** hold:
1. The actor has an `Employee` record (`employees.user_id = <authenticated user id>`).
2. The actor's `employee.organizationId` is non-null.
3. The actor's organization's `organizationTypeId` **equals** `currentStep.organizationTypeId`.
4. The actor's organization is an **ancestor-or-self** of the requester's organization, walking `Organization.parentId` upward.

Rule 4 is what stops a Team Lead of Department B approving a request from Department A. Rules 3+4 together are the complete authority check.

### 4.2 Reference algorithm
```
resolveApproverScope(requesterOrgId):
  chain = []
  org = findOrganization(requesterOrgId)
  while org != null:
    chain.push({ organizationId: org.id, organizationTypeId: org.organizationTypeId })
    org = org.parentId ? findOrganization(org.parentId) : null
  return chain      // [self, parent, grandparent, ...]

canActAt(actorEmployee, requesterEmployee, step):
  if actorEmployee.organizationId == null: return false
  actorOrg = findOrganization(actorEmployee.organizationId)
  if actorOrg.organizationTypeId != step.organizationTypeId: return false
  chain = resolveApproverScope(requesterEmployee.organizationId)
  return chain.some(link => link.organizationId == actorOrg.id)
```

Guard against a cyclic `parentId` (the data allows it): cap the walk at 20 hops and treat an over-length chain as `403` rather than looping forever.

### 4.3 Consequences that must not be "fixed" by an agent
- **Multiple people can be eligible** for the same step (everyone in that org with that type). First valid action wins; the rest get `409`. This is intended.
- **A step can have zero eligible actors** if no ancestor org has that `organizationTypeId`. The request then legitimately stalls. Surface it plainly (`GET .../:id` shows the current step) — do **not** auto-skip the step, auto-approve, or fall back to "any admin". Silent escalation is worse than a visible stall.
- Hard-coding `TEAM_LEAD` / `MANAGER` / `DEPARTMENT_MANAGER` anywhere in engine logic is forbidden (brief §2.3, §43). Names live in `workflow_steps.name` for display only.

---

## 5. REST API

Base prefix `/api` is applied globally (`app.setGlobalPrefix('api')`). All routes below require `JwtAuthGuard` **except** none — every workflow route is authenticated.

Every response body uses the existing envelope from `ResponseHelper.success(...)`: `{ success, message, data, meta? }`. Errors use `ResponseHelper.error(...)` via `GlobalHttpExceptionFilter`: `{ statusCode, code, message, fieldErrors?, requestId? }`.

### 5.1 Agent 1 — definition + read endpoints
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/workflows` | List. Query: `page`, `limit`, `search`, `status`, `sortBy`, `sortOrder` — same defaults as the existing list DTOs (`page=1`, `limit=10`, max `100`, `sortBy=createdAt`, `sortOrder=desc`). |
| `GET` | `/api/workflows/:id` | Detail **including** `steps[]`, ordered root-first by following `parentId`. |
| `POST` | `/api/workflows` | Create definition. |
| `PUT` | `/api/workflows/:id` | Update definition (`name`, `description`, `formSchema`, `status`). `code` is immutable after create. |
| `POST` | `/api/workflows/:id/steps` | **Replace the entire step chain** for this workflow (see §5.4). |
| `POST` | `/api/workflow-requests` | Submit a new request. |
| `GET` | `/api/workflow-requests/:id` | Request detail. |
| `GET` | `/api/workflow-requests/:id/histories` | History list, `createdAt` ascending. |
| `GET` | `/api/workflow-requests` | List. Query: `page`, `limit`, `status`, `workflowId`, plus **`scope`** = `mine` \| `inbox` (see §5.5). |

### 5.2 Agent 2 — action endpoints
| Method | Path | Body |
|---|---|---|
| `POST` | `/api/workflow-requests/:id/approve` | `{ "revision": number, "comment"?: string }` |
| `POST` | `/api/workflow-requests/:id/feedback` | `{ "revision": number, "comment": string }` (comment **required**) |
| `POST` | `/api/workflow-requests/:id/reject` | `{ "revision": number, "comment": string }` (comment **required**) |
| `POST` | `/api/workflow-requests/:id/cancel` | `{ "revision": number, "comment"?: string }` |
| `POST` | `/api/workflow-requests/:id/resubmit` | `{ "revision": number, "formData": object, "comment"?: string }` |

All five return the updated request in the same shape as `GET /api/workflow-requests/:id`.

### 5.3 Agent 2 — notification endpoints
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/notifications` | Current actor's notifications, `createdAt` desc. Query: `limit` (default `10`, max `50`), `isRead?`. Response `meta` **must** include `unreadCount`. |
| `PATCH` | `/api/notifications/:id/read` | Mark one read. `404` if not the actor's own. |
| `PATCH` | `/api/notifications/read-all` | Mark all of the actor's unread as read. Returns `{ updatedCount }`. |

### 5.4 `POST /api/workflows/:id/steps` — replace-chain semantics
Body is the **whole ordered chain**, root first. Server assigns `parentId` from array order; the client never sends `parentId`.
```json
{
  "steps": [
    { "name": "Team Lead",          "organizationTypeId": "uuid-a" },
    { "name": "Manager",            "organizationTypeId": "uuid-b" },
    { "name": "Department Manager", "organizationTypeId": "uuid-c" }
  ]
}
```
- `steps[0].parentId = null`; `steps[n].parentId = steps[n-1].id`; `stepOrder = index`.
- Min 1 step, max 20.
- Rejected with `409 WORKFLOW_HAS_ACTIVE_REQUESTS` if any non-terminal request references this workflow — rewiring a chain under an in-flight request would leave `current_step_id` dangling. This is why replace-chain is safe: it can only run when nothing is in flight.
- Whole operation in one transaction: delete old steps, insert new chain.

### 5.5 `scope` on `GET /api/workflow-requests`
- `scope=mine` → requests where `employeeId` = actor's employee id. Powers "My Requests".
- `scope=inbox` → non-terminal requests where the actor satisfies §4.1 for the request's `currentStep`. Powers "Reviewer Inbox".
- Omitted → defaults to `mine`. There is no "all requests" scope in this phase.

### 5.6 Request/response DTO shapes

`POST /api/workflow-requests`:
```json
{ "workflowId": "uuid", "formData": { "leaveType": "ANNUAL", "startDate": "2026-09-01", "endDate": "2026-09-03", "reason": "..." } }
```

`WorkflowRequest` response object (used by detail, list rows, and all five action responses — **identical shape everywhere**):
```json
{
  "id": "uuid",
  "workflowId": "uuid",
  "workflow": { "id": "uuid", "code": "LEAVE_REQUEST", "name": "Đăng ký nghỉ phép" },
  "employeeId": "uuid",
  "employee": { "id": "uuid", "employeeCode": "EMP-001", "firstName": "A", "lastName": "B", "organizationId": 3 },
  "currentStepId": "uuid | null",
  "currentStep": { "id": "uuid", "name": "Manager", "organizationTypeId": "uuid", "parentId": "uuid | null" },
  "status": "IN_PROGRESS",
  "formData": {},
  "revision": 3,
  "submittedAt": "2026-08-28T10:00:00.000Z",
  "completedAt": null,
  "createdAt": "...",
  "updatedAt": "...",
  "permissions": { "canApprove": true, "canFeedback": true, "canReject": true, "canCancel": false, "canResubmit": false }
}
```

`permissions` is **computed per requesting actor** by the backend, from the §4.1 rule. Agent 3 uses it to show/hide buttons. It is a UX convenience only — the backend re-validates on every action regardless (brief §34). Agent 1 owns the shape; Agent 2 owns the values for action-related flags and must return the same object from action endpoints.

`WorkflowHistory` response object:
```json
{
  "id": "uuid",
  "workflowRequestId": "uuid",
  "workflowStepId": "uuid | null",
  "step": { "id": "uuid", "name": "Manager" },
  "employeeId": "uuid",
  "employee": { "id": "uuid", "firstName": "A", "lastName": "B", "employeeCode": "EMP-001" },
  "action": "APPROVE",
  "comment": "string | null",
  "createdAt": "..."
}
```

`Notification` response object:
```json
{
  "id": "uuid",
  "recipientEmployeeId": "uuid",
  "type": "WORKFLOW_REQUEST_APPROVED",
  "title": "Đơn nghỉ phép cần bạn duyệt",
  "message": "Team Lead đã approve đơn nghỉ phép của Nguyen Van A",
  "referenceId": "uuid",
  "isRead": false,
  "createdAt": "..."
}
```

---

## 6. Error Codes

New codes to add to `backend/src/common/constants/error-code.constant.ts`. **Agent 1 adds the whole block in one edit** (including Agent 2's codes) so the file is touched once — see §11.

```
WORKFLOW_NOT_FOUND
WORKFLOW_CODE_EXISTS
WORKFLOW_NOT_ACTIVE
WORKFLOW_HAS_NO_STEPS
WORKFLOW_HAS_ACTIVE_REQUESTS
WORKFLOW_STEP_NOT_FOUND
WORKFLOW_REQUEST_NOT_FOUND
WORKFLOW_REQUEST_STALE
WORKFLOW_REQUEST_INVALID_STATE
WORKFLOW_ACTION_NOT_ALLOWED
NOTIFICATION_NOT_FOUND
```

| Code | Status | When |
|---|---|---|
| `WORKFLOW_NOT_FOUND` | 404 | Unknown workflow id. |
| `WORKFLOW_CODE_EXISTS` | 409 | Duplicate `code` on create. |
| `WORKFLOW_NOT_ACTIVE` | 400 | Submitting against a `DRAFT`/`ARCHIVED` workflow. |
| `WORKFLOW_HAS_NO_STEPS` | 400 | Submitting against a workflow with an empty chain. |
| `WORKFLOW_HAS_ACTIVE_REQUESTS` | 409 | Replacing steps while a non-terminal request exists. |
| `WORKFLOW_STEP_NOT_FOUND` | 404 | Unknown step id. |
| `WORKFLOW_REQUEST_NOT_FOUND` | 404 | Unknown request id. |
| `WORKFLOW_REQUEST_STALE` | **409** | Submitted `revision` ≠ stored `revision`. **This is the concurrency loser's error** (brief §33). |
| `WORKFLOW_REQUEST_INVALID_STATE` | 409 | Action not legal for current status (e.g. approve a `REJECTED` request, resubmit when not `NEEDS_REVISION`). |
| `WORKFLOW_ACTION_NOT_ALLOWED` | **403** | Actor fails the §4.1 authority check, or a non-requester tries `CANCEL`/`RESUBMIT`. |
| `NOTIFICATION_NOT_FOUND` | 404 | Unknown notification, or not the actor's own. |

Standard codes reused as-is: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `EMPLOYEE_NOT_FOUND` (404), `ORGANIZATION_TYPE_NOT_FOUND` (404/400).

**403 vs 409 discipline:** 403 = "you are not allowed to do this, ever, as you." 409 = "you might be allowed, but the request moved on / state forbids it." Never use 400 for either.

---

## 7. State Machine

### 7.1 SUBMIT — `POST /api/workflow-requests`
```
Validate workflow: exists, status=ACTIVE, has >= 1 step
Validate formData against workflow.formSchema
Find root step: parentId = null
INSERT workflow_request  { status: IN_PROGRESS, currentStepId: rootStep.id, submittedAt: now, revision: 0 }
INSERT workflow_history  { action: SUBMIT, workflowStepId: null, employeeId: requester }
COMMIT
→ emit workflow.request.created
```

### 7.2 APPROVE — moves **up**
```
next = workflow_step WHERE parentId = currentStep.id
if next exists:  currentStepId = next.id;  status = IN_PROGRESS
else:            currentStepId = null;     status = APPROVED;  completedAt = now
```
`APPROVED` emits **both** `workflow.request.approved` and `workflow.request.completed`.

### 7.3 FEEDBACK — moves **down exactly one level**
```
if currentStep.parentId != null:
    currentStepId = currentStep.parentId;  status = IN_PROGRESS
else:
    currentStepId = currentStep.id (unchanged, stays at root);  status = NEEDS_REVISION
```
This is the generic recursion the brief demands (§5, §43): the engine only reads `parentId`. Because the chain is a linked list, `parentId` is the unique previous approver, and root's `parentId = null` is exactly "goes back to the employee". **This is why §2.2 requires the linked-list invariant** — with a branching tree, "one level down" would be ambiguous.

### 7.4 RESUBMIT — requester only, `NEEDS_REVISION` only
```
Guard: actor.employeeId == request.employeeId          else 403 WORKFLOW_ACTION_NOT_ALLOWED
Guard: status == NEEDS_REVISION                        else 409 WORKFLOW_REQUEST_INVALID_STATE
Validate formData against workflow.formSchema
formData = new;  status = IN_PROGRESS;  currentStepId = root step (unchanged)
INSERT history { action: RESUBMIT, workflowStepId: null }
```

### 7.5 REJECT — terminal
```
status = REJECTED;  currentStepId = null;  completedAt = now
```

### 7.6 CANCEL — requester only, non-terminal only
```
Guard: actor.employeeId == request.employeeId          else 403
Guard: status in (IN_PROGRESS, NEEDS_REVISION)         else 409
status = CANCELLED;  currentStepId = null;  completedAt = now
```

### 7.7 Legality matrix
| Status | approve | feedback | reject | cancel | resubmit |
|---|---|---|---|---|---|
| `IN_PROGRESS` | approver | approver | approver | requester | — |
| `NEEDS_REVISION` | — | — | — | requester | requester |
| `APPROVED` / `REJECTED` / `CANCELLED` | — | — | — | — | — |

`—` = `409 WORKFLOW_REQUEST_INVALID_STATE`. Wrong person on an otherwise-legal action = `403 WORKFLOW_ACTION_NOT_ALLOWED`.

---

## 8. Transactions and Concurrency

### 8.1 Mandatory order (brief §9, §43)
```
BEGIN
  re-read request FOR the transaction
  validate status + authority + revision
  INSERT workflow_histories
  UPDATE workflow_requests (including revision = revision + 1)
  INSERT notifications
COMMIT
--- only now ---
emit application event  →  listener  →  socket gateway  →  Socket.IO
```
**Never emit an event or touch a socket before COMMIT.** A rolled-back transaction that already pushed a socket event puts the UI permanently out of sync with the database.

### 8.2 Optimistic locking (brief §33)
Client sends the `revision` it last read. Server updates conditionally:
```sql
UPDATE workflow_requests
   SET ..., revision = revision + 1
 WHERE id = :id AND revision = :expectedRevision
```
Zero rows affected → `409 WORKFLOW_REQUEST_STALE`. Two browsers approving simultaneously: one succeeds, the other gets `409` and must refetch. Agent 3 handles that `409` by invalidating and refetching, then showing the current state.

### 8.3 Transaction plumbing — resolved architectural gap
`BaseService` (`backend/src/common/services/base.service.ts`) holds **one Prisma delegate** and has **no transaction-aware method**. Its `update()` cannot participate in an outer `$transaction`, so an action that must write history + request + notification atomically cannot be expressed with inherited methods alone.

**Decision (Tech Lead, not agent discretion):** Agent 2 injects `PrismaService` and uses `prisma.$transaction(async (tx) => …)` for the multi-table action write. This is the sanctioned narrow exception, permitted because `AGENTS.md` already allows injecting `PrismaService` for work a service's own single delegate cannot reach, and atomicity across three tables is exactly that. Constraints:
- Every single-table read/write that **can** go through an inherited `BaseService` method **must** (list, findOne, findByIds, plain updates outside a transaction).
- The `$transaction` block is confined to the action-engine service. Controllers, listeners, and the gateway never touch `PrismaService`.
- Each workflow service still `extends BaseService` and its interface still `extends IBaseService` — the mandatory flow is intact; only the atomic write is lowered to `tx`.
- Agent 2 documents this in its final report so it is reviewable, not buried.

Adding transaction support to `BaseService` generically is **out of scope** — it would change a class every module depends on, mid-parallel-work. Recorded as a follow-up.

---

## 9. Application Events → Socket.IO

### 9.1 Layering (brief §10, §43)
```
Controller → Service Interface → Service → BaseService/tx → DB → COMMIT
   → EventEmitter2 (application event)
   → @OnEvent listener
   → WorkflowGateway
   → Socket.IO → Frontend
```
A business service **must not** call `socket.emit()`. It emits an application event; only the gateway touches Socket.IO. This mirrors the existing `invitation.created` → `InvitationMailListener` pattern already in the repo.

### 9.2 Socket event names (FROZEN)
```
workflow.request.created
workflow.request.approved
workflow.request.feedback
workflow.request.rejected
workflow.request.cancelled
workflow.request.resubmitted
workflow.request.completed
notification.created
```

### 9.3 Payloads (FROZEN)
Workflow events — minimal, no `formData`, no PII beyond ids:
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
`notification.created`:
```json
{ "notificationId": "uuid", "recipientEmployeeId": "uuid", "type": "WORKFLOW_REQUEST_APPROVED", "referenceId": "uuid", "occurredAt": "..." }
```

### 9.4 Socket is a hint, never the source of truth (brief §11, §43)
```
Socket event → queryClient.invalidateQueries(...) → REST refetch → render
```
Agent 3 must **not** merge payload values into cache or render from a socket payload. A dropped or out-of-order event must degrade to "slightly stale until next refetch", never to "wrong data displayed".

### 9.5 Rooms (brief §12)
No global broadcast. Exactly two room shapes:
```
employee:{employeeId}
workflow-request:{requestId}
```
- On connect, the gateway authenticates the JWT, resolves the actor's `employeeId`, and joins `employee:{employeeId}`.
- A client viewing a request detail page emits `workflow-request:subscribe` with `{ requestId }` to join `workflow-request:{requestId}`, and `workflow-request:unsubscribe` on unmount.
- Server **must** re-verify the actor may read that request before joining the room. An unauthorized join is refused silently (no room membership) — room membership is an authorization boundary, not a convenience.
- Notification events go to `employee:{recipientEmployeeId}` only.

### 9.6 Socket.IO is not yet installed
Repo inspection: neither `backend/package.json` nor `frontend/package.json` contains `socket.io`. Agent 2 installs `@nestjs/websockets @nestjs/platform-socket.io socket.io`; Agent 3 installs `socket.io-client`. Namespace: **`/ws`**. Auth: JWT passed in the handshake (`auth: { token }`), verified with the same RS256 public key the HTTP strategy uses.

---

## 10. Notification Generation Rules (brief §13)

Recipients are **organization-scoped sets**, not single people — a direct consequence of §4. "Notify the Manager" means "notify every employee eligible to act at the Manager step for this request".

| Trigger | Recipients |
|---|---|
| SUBMIT | Everyone eligible at the new `currentStep` (§4.1). |
| APPROVE → next step exists | Everyone eligible at the new `currentStep`. |
| APPROVE → chain finished | The requester. Type `WORKFLOW_REQUEST_COMPLETED`. |
| FEEDBACK → moved to a parent step | Everyone eligible at that parent step. |
| FEEDBACK → was at root (`NEEDS_REVISION`) | The requester. |
| REJECT | The requester. |
| CANCEL | Everyone who was eligible at the `currentStep` at cancel time, so a pending reviewer's inbox does not keep a dead item. |
| RESUBMIT | Everyone eligible at the root step. |

- The actor never notifies themselves. Filter the actor's own `employeeId` out of every recipient set.
- Zero recipients is valid (the §4.3 stall case) — write no notifications, do not error, do not fall back to notifying an admin.
- Notification rows are written **inside** the action transaction (§8.1); `notification.created` sockets fire **after** commit.

---

## 11. Shared Files — single owner each (brief §27, §28)

Repo-inspected real paths. **Only the owner edits the file.** Another agent needing a change requests it via its final report.

| File | Owner | Rule for others |
|---|---|---|
| `backend/prisma/schema.prisma` | **Agent 1** | Agent 2 needs the `Notification` model + `NotificationType` enum: Agent 1 adds them in the same initial migration (§2.5 is fully specified, so no back-and-forth). Agent 2 never edits the schema. |
| `backend/prisma/migrations/**` | **Agent 1** | Nobody else creates a workflow migration. |
| `backend/src/app.module.ts` | **Agent 1** | Agent 1 registers `WorkflowModule` **and** `NotificationModule` up front, importing Agent 2's module by its agreed path. Agent 2 creates that module file; Agent 1 wires it once. |
| `backend/src/common/constants/error-code.constant.ts` | **Agent 1** | Agent 1 adds **all** codes in §6 in one edit, including Agent 2's. |
| `backend/src/common/exceptions/app.exception.ts` | **Agent 1** | Same: Agent 1 adds every exception class for §6 codes in one edit. |
| `backend/src/common/constants/audit-action.constant.ts` | **Agent 1** | Workflow entities do **not** use the shared audit log (they have `workflow_histories`, which is a richer, domain-specific trail). Pass `entityType: null` to `BaseService` (the sanctioned audit opt-out) and add **nothing** here. |
| `backend/src/main.ts` | **Agent 2** | Only if the Socket.IO adapter needs registering. Agent 1 does not touch it. |
| `backend/package.json` | **Agent 2** | Socket.IO deps. Agent 1 adds no dependency. |
| `frontend/src/routes/app.routes.tsx` | **Agent 3** | Sole owner of all workflow routes. |
| `frontend/src/layouts/AppLayout.tsx` | **Agent 3** | ⚠️ **Highest-risk file.** `Navbar`, `UserMenu`, and `Sidebar` are all defined inside this one file. Agent 3 adds the Bell to `Navbar` and workflow items to `NAV_GROUPS`. **Must not** modify `UserMenu`'s Change Password link, Logout handler, or dropdown (brief §17, §25, §43). |
| `frontend/src/shared/api/api-endpoints.ts` | **Agent 3** | Adds `workflows`, `workflowRequests`, `notifications` namespaces. |
| `frontend/src/store/index.ts` | **Agent 3** | Only if a workflow slice is genuinely needed (§13 guidance: probably not). |
| `frontend/package.json` | **Agent 3** | `socket.io-client`. React Flow + dagre are already installed — do not re-add or bump them. |

### Files nobody may touch
`backend/src/common/services/base.service.ts`, `backend/src/common/interfaces/base.interface.ts`, `backend/src/common/filters/http-exception.filter.ts`, `backend/src/common/helpers/response.helper.ts`, `backend/src/common/pipes/validation-exception-factory.ts`, `frontend/src/shared/api/api-client.ts`, `frontend/src/shared/api/base-api.service.ts`, `frontend/src/providers/**`, and every existing module under `backend/src/modules/**` and `frontend/src/features/**`. If workflow work seems to require changing one of these, stop and report it — that is a contract-level decision.

---

## 12. Frontend Routes (Agent 3, FROZEN)

| Path | Page | Notes |
|---|---|---|
| `/workflows` | `WorkflowListPage` | `sidebarActiveKey: 'workflow.list'` |
| `/workflows/create` | `WorkflowCreatePage` | Form schema builder + step builder + React Flow |
| `/workflows/:id/edit` | `WorkflowEditPage` | Same builder, prefilled |
| `/workflow-requests/new` | `WorkflowRequestSubmitPage` | Pick active workflow → dynamic form |
| `/workflow-requests` | `MyRequestsPage` | `scope=mine` |
| `/workflow-requests/inbox` | `ReviewerInboxPage` | `scope=inbox` |
| `/workflow-requests/:id` | `WorkflowRequestDetailPage` | Timeline + action buttons. **Notification click target** (brief §20). |

All inside `AuthGuard` + `AppLayout`. Two new sidebar groups per §11's `NAV_GROUPS`.

Route order caution: declare `/workflow-requests/inbox` and `/workflow-requests/new` **before** `/workflow-requests/:id`, or the literal segments get captured as an `:id`.

---

## 13. Frontend State Ownership

Follows the repo's existing rule (`AGENTS.md` Frontend Rules): TanStack Query owns server state, Redux owns global client state, local state owns UI.

| State | Owner |
|---|---|
| Workflow list/detail, requests, histories, notifications | TanStack Query |
| Unread notification count | TanStack Query (`meta.unreadCount` from `GET /api/notifications`) — **not** Redux, so socket-triggered invalidation refreshes it for free |
| Socket connection instance | React context/provider in the workflow feature |
| Bell dropdown open, dialog open, form state | Local state / React Hook Form |
| Workflow builder form (schema + steps) | React Hook Form (`useFieldArray`), same as the existing bulk editors |

Query keys (FROZEN so invalidation matches across agents):
```
['workflows', queryState]
['workflows', id]
['workflow-requests', queryState]
['workflow-requests', id]
['workflow-requests', id, 'histories']
['notifications']
```

Socket → invalidation map:
| Socket event | Invalidate |
|---|---|
| `workflow.request.created` / `.approved` / `.feedback` / `.rejected` / `.cancelled` / `.resubmitted` / `.completed` | `['workflow-requests']`, `['workflow-requests', payload.workflowRequestId]`, `['workflow-requests', payload.workflowRequestId, 'histories']` |
| `notification.created` | `['notifications']` |

---

## 14. Mock Strategy (brief §29)

No agent waits on another.

**Agent 2 without Agent 1:** code against the interfaces and DTO shapes in this contract. If `WorkflowRequest` Prisma types don't exist yet, define local TypeScript types matching §2.3 exactly and swap to Prisma types on merge. Do not create a second migration.

**Agent 3 without any backend:** implement `workflow.api.ts` / `notification.api.ts` against §5 exactly, then feed them from a fixture module (e.g. `features/workflow/services/__mocks__/`) toggled by one flag. Payload shapes must match §5.6 field-for-field — a mock that "works" with different field names is worse than no mock. Fake sockets by calling the same invalidation handler §13 defines. **Remove the flag and fixtures during integration**, and say so in the final report.

---

## 15. Out of Scope (do not build)

- Automated tests of any kind — no unit, integration, or E2E task exists (brief §43). Manual verification flows are in `workflow-integration-plan.md`.
- Changes to `UserMenu`, Change Password, or Logout (brief §17, §25, §43).
- `DRAFT` workflow-request save/resume (§1.2).
- `REVIEW` action endpoint (§1.3).
- Workflow versioning/pinning beyond the informational `version` column.
- Delegation, out-of-office, auto-escalation, SLA timers, reminders.
- Parallel/branching approval, multi-assignee steps, conditional routing.
- Email notification for workflow events (in-app + socket only this phase).
- Adding transaction support to `BaseService` (§8.3).
