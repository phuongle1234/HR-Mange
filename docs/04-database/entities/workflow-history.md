---
id: DB-WORKFLOW-HISTORY
type: database
module: workflow
status: draft
---

# Workflow History Entity

Source: `docs/09-workflow/plans/workflow-module/workflow-contract.md` §§2.4, 7, 8.1, 11 (frozen contract, `WORK-027`), as implemented in `backend/prisma/schema.prisma`.

## Purpose
Store one row per action taken on a `WorkflowRequest` — who acted, at which step, what they did, and what they said about it. This is the module's audit trail and the source of the request-detail timeline. `DB-WORKFLOW-REQUEST` holds the current state; this table holds how it got there.

## Dependencies
- `DB-WORKFLOW-REQUEST`, `DB-WORKFLOW-STEP`, `DB-EMPLOYEE`, `DB-CONVENTIONS`
- Contract §§2.4, 5.1, 5.6, 7, 8.1, 11

## Requirements

### Immutable — insert-only
Rows are written and never touched again. There is no update endpoint and no delete endpoint, and none may ever be added (contract §2.4). A history that can be edited is not a history: the value of the timeline rests entirely on a reader being able to assume no row was changed after the fact. Every action writes its history row **inside** the same transaction that updates the request and inserts notifications (contract §8.1), so a rolled-back action leaves no trace and a committed action always has one.

### `workflow_step_id` is nullable because some actors occupy no step
`SUBMIT`, `RESUBMIT`, and `CANCEL` are performed by the **requester**, who is not an approver and therefore stands at no step in the chain. For those actions `workflow_step_id` is `null`. This is a factual absence, not a missing value to be filled in later — writing the request's current step there would falsely claim the requester acted with that step's authority. Approver actions (`APPROVE`, `FEEDBACK`, `REJECT`) always record the step they happened **at**, which is the step the request was on before the transition, not after.

### Workflow entities opt out of the shared audit log
Workflow services pass `entityType: null` to `BaseService` (the sanctioned audit opt-out) and add nothing to `AuditEntityType`, `AuditAction`, or `AuditLogListener`. This table is the reason: it is already a richer, domain-specific trail, carrying the acting step and the actor's comment, which the generic `audit_logs` shape does not model. Duplicating workflow actions into `audit_logs` as well would produce two half-authoritative histories of the same events — and once they diverged (a failed listener, a differently scoped transaction), there would be no defensible answer to which one was the record. One trail, and it is this one.

## Design

### Table
`workflow_histories`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `String` (uuid) | PK, `@default(uuid())` | |
| `workflowRequestId` | `String` | not null, `@map("workflow_request_id")`, FK → `workflow_requests.id`, `onDelete: Cascade` | The history belongs to the request; it has no meaning apart from it. |
| `workflowStepId` | `String?` | nullable, `@map("workflow_step_id")`, FK → `workflow_steps.id`, `onDelete: Restrict` | The step the action happened **at**. `null` for `SUBMIT`/`RESUBMIT`/`CANCEL`. `Restrict` so a step referenced by history cannot be deleted out from under it — a timeline row pointing at nothing would be unreadable. |
| `employeeId` | `String` | not null, `@map("employee_id")`, FK → `employees.id`, `onDelete: Restrict` | The actor. `Restrict` — an audit row must never lose its actor. |
| `action` | `WorkflowAction` | not null | Values: `SUBMIT`, `RESUBMIT`, `REVIEW`, `APPROVE`, `FEEDBACK`, `REJECT`, `CANCEL`. `REVIEW` is reserved for a future "viewed without deciding" record; no endpoint writes it in this phase. |
| `comment` | `String?` | nullable, `@db.Text` | Required for `FEEDBACK` and `REJECT` at the DTO level (contract §5.2), nullable in the database so historical rows stay valid if the DTO rule ever changes. Optional for `APPROVE`, `CANCEL`, `RESUBMIT`. |
| `createdAt` | `DateTime` | not null, `@default(now())`, `@map("created_at")` | The only timestamp. There is no `updatedAt` — the row is never updated, so a second timestamp could only ever be misleading. |

Note the deliberate asymmetry: the `RESTRICT` on `workflow_step_id` and `employee_id` protects the trail's readability, while the `CASCADE` on `workflow_request_id` accepts that a deleted request takes its history with it. Retaining orphan history rows for a request that no longer exists would preserve nothing anyone could interpret.

### Relationships
- `WorkflowHistory N—1 WorkflowRequest` via `workflow_request_id` (`ON DELETE CASCADE`).
- `WorkflowHistory N—1 WorkflowStep` via `workflow_step_id`, nullable (`ON DELETE RESTRICT`).
- `WorkflowHistory N—1 Employee` via `employee_id`, relation `EmployeeWorkflowHistories` (`ON DELETE RESTRICT`).
- No `AuditLog` relationship — see Requirements.

## Validation
- `workflowRequestId`: required, must reference an existing request.
- `employeeId`: required, must reference an existing employee — the authenticated actor's own employee record, never a client-supplied value.
- `action`: required, one of `WorkflowAction`.
- `comment`: required and non-empty for `FEEDBACK` and `REJECT` (DTO-level, `400 VALIDATION_ERROR`); optional otherwise.
- `workflowStepId`: server-assigned only. `null` exactly for `SUBMIT`/`RESUBMIT`/`CANCEL`; otherwise the request's `current_step_id` as read at the start of the action transaction.
- Nothing about a history row is ever accepted directly from a client — rows are a by-product of the action endpoints, and there is no history write endpoint.

## Indexes
- Non-unique index on `workflow_request_id` (fetch a request's trail).
- Composite non-unique index on `(workflow_request_id, created_at)` — `GET /api/workflow-requests/:id/histories` returns `createdAt` ascending, and this index serves that ordering directly rather than sorting after the fact.

## Test Notes
- Migration creates `workflow_histories` with a UUID PK, the `WorkflowAction` enum, and the FK/cascade/restrict behaviour above.
- Every successful action writes exactly one history row, in the same transaction as the request update; a rolled-back action writes none.
- `SUBMIT`, `RESUBMIT`, and `CANCEL` rows must have `workflow_step_id = null`.
- `APPROVE`, `FEEDBACK`, and `REJECT` rows must record the step the request was on **before** the transition.
- `FEEDBACK` and `REJECT` without a comment must be rejected before any row is written.
- No update or delete route exists for this resource — a route audit should confirm only the `GET .../histories` read path touches it.
- Deleting a `WorkflowRequest` removes its history (cascade); deleting a referenced `WorkflowStep` or `Employee` must be refused.
- Histories are returned `createdAt` ascending.

## Ambiguities
None blocking. Flagged, not silently decided:
- Immutability is a convention enforced by the absence of write paths, not by a database grant or trigger. Direct SQL, or a future ORM call, could still update a row. If the trail ever needs to be tamper-evident rather than merely un-exposed, that is a separate decision.
- `created_at` alone cannot break ties between two rows written in the same transaction at identical timestamps. In this phase each action writes exactly one row, so the case does not arise; if a future action writes several, the timeline's ordering within a transaction would need a sequence column.
- `REVIEW` exists in the enum with no writer. It is defined so the enum never has to change later (contract §1.3).
