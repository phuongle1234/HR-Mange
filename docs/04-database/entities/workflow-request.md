---
id: DB-WORKFLOW-REQUEST
type: database
module: workflow
status: draft
---

# Workflow Request Entity

Source: `docs/09-workflow/plans/workflow-module/workflow-contract.md` §§2.3, 3, 7, 8 (frozen contract, `WORK-027`), as implemented in `backend/prisma/schema.prisma`.

## Purpose
Store one row per submission made by an employee against a `Workflow` definition — what they entered, where the request currently sits in the chain, and its lifecycle status. This is the single mutable row of the workflow module; everything about *how it got here* lives in `DB-WORKFLOW-HISTORY`.

## Dependencies
- `DB-WORKFLOW`, `DB-WORKFLOW-STEP`, `DB-EMPLOYEE`, `DB-WORKFLOW-HISTORY`, `DB-CONVENTIONS`
- Contract §§2.3, 3.2, 5.2, 5.5, 5.6, 7, 8

## Requirements

### `current_step_id` is null only when terminal
While a request is live (`IN_PROGRESS` or `NEEDS_REVISION`) it always points at a step. `current_step_id` becomes `null` **only** on reaching a terminal status — `APPROVED`, `REJECTED`, `CANCELLED` — at which point `completed_at` is set in the same write. The pairing is exact and is what lets a reader tell "in flight" from "finished" without interpreting the enum: a null current step and a non-null `completed_at` mean the request is done.

Note the one non-obvious case: `NEEDS_REVISION` keeps `current_step_id` pointing at the **root** step, not null. FEEDBACK at the root does not detach the request; it hands it back to the requester while the chain position stays where a RESUBMIT will restart it (contract §§7.3, 7.4).

### `revision` is an optimistic-lock token
`revision` starts at `0` and is incremented by every action write. Every action endpoint requires the client to send the `revision` it last read, and the update is conditional:
```sql
UPDATE workflow_requests
   SET ..., revision = revision + 1
 WHERE id = :id AND revision = :expectedRevision
```
Zero rows affected → `409 WORKFLOW_REQUEST_STALE`. Two reviewers approving the same request simultaneously cannot both succeed: one wins, the other is told the request moved on and must refetch.

This column is **not** in the original brief's field list. It was added deliberately and recorded as a Tech Lead decision (contract §2.3), because the brief requires that concurrent APPROVEs cannot both succeed and there is no safe way to satisfy that without either a version token or `SELECT … FOR UPDATE`. A single `Int` column is the smaller and more portable of the two.

### `form_data` is what the employee typed
`form_data` holds the submitted values, a flat object keyed by the `key` values in the workflow's `form_schema` — the counterpart to `workflows.form_schema`, which holds *which fields the form has* (contract §3; see `DB-WORKFLOW`). It is validated against the schema at SUBMIT and re-validated with the same validator at RESUBMIT, which overwrites it in place. Because the schema lives on the other table, an admin may edit the form for future requests without altering what any past requester actually entered.

### Audit
Like the rest of the module, this entity opts out of the shared audit log (`entityType: null` on `BaseService`); `workflow_histories` is the trail. See `DB-WORKFLOW` for the reasoning.

## Design

### Table
`workflow_requests`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `String` (uuid) | PK, `@default(uuid())` | |
| `workflowId` | `String` | not null, `@map("workflow_id")`, FK → `workflows.id`, `onDelete: Restrict` | A definition with any request cannot be deleted. |
| `employeeId` | `String` | not null, `@map("employee_id")`, FK → `employees.id`, `onDelete: Restrict` | The requester. `Restrict`, not cascade — a submitted request is a business record and must not vanish with its author. |
| `currentStepId` | `String?` | nullable, `@map("current_step_id")`, FK → `workflow_steps.id`, `onDelete: Restrict` | Relation `WorkflowRequestCurrentStep`. `null` only when terminal. `Restrict` prevents deleting a step an in-flight request is sitting on — the replace-chain guard (`409 WORKFLOW_HAS_ACTIVE_REQUESTS`) makes this a backstop rather than the primary defence. |
| `status` | `WorkflowRequestStatus` | not null, `@default(IN_PROGRESS)` | Values: `DRAFT`, `IN_PROGRESS`, `NEEDS_REVISION`, `APPROVED`, `REJECTED`, `CANCELLED`. |
| `formData` | `Json` | not null, `@map("form_data")` | Values the employee entered. Overwritten by RESUBMIT. |
| `revision` | `Int` | not null, `@default(0)` | Optimistic-lock token. |
| `submittedAt` | `DateTime?` | nullable, `@map("submitted_at")` | Set at SUBMIT. |
| `completedAt` | `DateTime?` | nullable, `@map("completed_at")` | Set on `APPROVED`/`REJECTED`/`CANCELLED`. |
| `createdAt` | `DateTime` | not null, `@default(now())`, `@map("created_at")` | |
| `updatedAt` | `DateTime` | not null, `@updatedAt`, `@map("updated_at")` | |

`submittedAt` is nullable although every request in this phase is created already submitted — `POST /api/workflow-requests` goes straight to `IN_PROGRESS`. The nullability exists for the reserved `DRAFT` status (contract §1.2), which no endpoint in this phase creates.

### Status lifecycle
```text
                      (POST /api/workflow-requests)
                                   |
                                   v
                             IN_PROGRESS
                         /       |        \        \
                  APPROVE     FEEDBACK   REJECT   CANCEL (requester)
                     |        (down 1)      |        |
        next step? --+                      |        |
          yes -> IN_PROGRESS (advance)      |        |
          no  -> APPROVED                   |        |
                                            v        v
   at root -> NEEDS_REVISION            REJECTED  CANCELLED
                     |
             RESUBMIT (requester) -> IN_PROGRESS at root step
```
- Terminal: `APPROVED`, `REJECTED`, `CANCELLED`. Any action on a terminal request is `409 WORKFLOW_REQUEST_INVALID_STATE`.
- `DRAFT` is reserved and unreachable in this phase.
- Wrong person on an otherwise-legal action is `403 WORKFLOW_ACTION_NOT_ALLOWED`; a legal actor acting on a state that forbids it is `409`.

### Relationships
- `WorkflowRequest N—1 Workflow` via `workflow_id` (`ON DELETE RESTRICT`).
- `WorkflowRequest N—1 Employee` via `employee_id`, relation `EmployeeWorkflowRequests` (`ON DELETE RESTRICT`).
- `WorkflowRequest N—1 WorkflowStep` via `current_step_id`, relation `WorkflowRequestCurrentStep`, nullable (`ON DELETE RESTRICT`).
- `WorkflowRequest 1—N WorkflowHistory` via `workflow_histories.workflow_request_id` (`ON DELETE CASCADE`) — the history belongs to the request and has no meaning without it.
- No `AuditLog` relationship.

## Validation
- `workflowId`: required; the workflow must exist, be `ACTIVE`, and have at least one step (`404 WORKFLOW_NOT_FOUND`, `400 WORKFLOW_NOT_ACTIVE`, `400 WORKFLOW_HAS_NO_STEPS`).
- `formData`: required, validated against the workflow's `form_schema` per contract §3.2. Field errors use path `formData.<key>`. A key not present in the schema is a `400`.
- `revision`: required on every action body; must equal the stored value or the action fails with `409 WORKFLOW_REQUEST_STALE`.
- `currentStepId`: server-assigned only — never accepted as API input. At SUBMIT it is the root step (`parent_id IS NULL`).
- Authority to act at `currentStepId` is checked per contract §4.1 on every action, regardless of the `permissions` object returned to the client, which is a UX convenience only.

## Indexes
- Non-unique index on `employee_id` (`scope=mine`, "My Requests").
- Non-unique index on `current_step_id` (`scope=inbox` and the replace-chain active-request guard).
- Non-unique index on `status` (list filtering, terminal/non-terminal checks).
- Non-unique index on `workflow_id` (per-definition listing and the active-request guard).

## Test Notes
- Migration creates `workflow_requests` with a UUID PK, the `WorkflowRequestStatus` enum, and the FK/restrict behaviour above.
- SUBMIT must write the request and its `SUBMIT` history row in one transaction, with `revision = 0`, `currentStepId` = root step, `submittedAt` set.
- Two concurrent APPROVEs with the same `revision`: exactly one succeeds; the other gets `409 WORKFLOW_REQUEST_STALE` and the stored `revision` advances by exactly one.
- Every terminal transition must set `currentStepId = null` and `completedAt` in the same write — no state where one is set and the other is not.
- FEEDBACK at the root must leave `currentStepId` at the root step and set `NEEDS_REVISION`, not null it.
- Deleting a `Workflow`, `Employee`, or `WorkflowStep` referenced by a request must be refused by the FK.
- Deleting a request removes its `WorkflowHistory` rows (cascade).
- No event or socket emission may occur before COMMIT (contract §8.1).

## Ambiguities
None blocking. Flagged, not silently decided:
- `DRAFT` is reachable in the enum but by no endpoint. If save-as-draft is added later, the `submittedAt`-null and `currentStepId`-null-while-non-terminal cases become live and the "null only when terminal" invariant above needs restating.
- Nothing at the database level enforces the `completedAt` / `currentStepId` / terminal-status triple; it is a service-layer invariant. A check constraint would express it, and is not present.
