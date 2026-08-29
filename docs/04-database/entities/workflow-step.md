---
id: DB-WORKFLOW-STEP
type: database
module: workflow
status: draft
---

# Workflow Step Entity

Source: `docs/09-workflow/plans/workflow-module/workflow-contract.md` §§2.2, 4, 5.4, 7.2, 7.3 (frozen contract, `WORK-027`), as implemented in `backend/prisma/schema.prisma`.

## Purpose
Store one row per approval stage in a workflow definition's chain. Each row answers exactly one question — *what kind of organization may act here* — and points at the stage that follows it. The engine's APPROVE and FEEDBACK transitions are nothing but walks over these rows.

## Dependencies
- `DB-WORKFLOW`, `DB-ORGANIZATION-TYPE`, `DB-WORKFLOW-REQUEST`, `DB-WORKFLOW-HISTORY`, `DB-CONVENTIONS`
- Contract §§2.2, 4, 5.4, 7.2, 7.3

## Requirements

### `parent_id` is the only chain source
`parent_id` defines the chain, and nothing else does. `step_order` exists for display and as a tiebreak in listings; it is never read to decide what comes next. This is a single-source-of-truth requirement, not a preference: with two ordering sources, any write path that updated one and not the other would leave them disagreeing, and there would be no principled way to say which was right. The engine reads `parent_id` only.

- `parent_id = null` marks the root step — the first approver, and the step a request starts at.
- APPROVE moves **up**: `next = step WHERE parent_id = currentStep.id`. If no such step exists, the chain is finished and the request becomes `APPROVED` (contract §7.2).
- FEEDBACK moves **down exactly one level**: `currentStepId = currentStep.parentId`, or, at the root (`parent_id IS NULL`), the request becomes `NEEDS_REVISION` and returns to the requester (contract §7.3).

### The chain is a linked list, not a tree
Each step has at most one child. The self-relation is one-to-many at the Prisma level (`children WorkflowStep[]`), so the database does not itself forbid a second child; the invariant is enforced on write by the replace-chain API, which is the only path that creates steps. `POST /api/workflows/:id/steps` takes the whole ordered chain root-first and assigns `steps[0].parentId = null`, `steps[n].parentId = steps[n-1].id`, `stepOrder = index`, in one transaction that deletes the old steps and inserts the new ones (contract §5.4). The client never sends `parent_id`.

This is what makes "FEEDBACK descends exactly one level" a well-defined operation. In a branching tree a step could have several children, so "the previous step" for a given position would not be unique and the engine would have to guess or pick. As a linked list, `parent_id` *is* the unique previous approver, and root's `parent_id = null` is exactly "goes back to the employee" — no special-casing, no configuration.

The replace-chain operation is rejected with `409 WORKFLOW_HAS_ACTIVE_REQUESTS` if any non-terminal request references the workflow. Rewiring the chain under an in-flight request would leave its `current_step_id` pointing at a deleted row. This guard is what makes wholesale replacement safe.

### `name` is a display label only
`name` (e.g. `Team Lead`) is rendered in the UI and in history timelines. It is **never** used for logic. Authority at a step comes from `organization_type_id` alone, via the four-part check in contract §4.1 — the actor's organization must have that organization type, and must be an ancestor-or-self of the requester's organization. Hard-coding `TEAM_LEAD`/`MANAGER`/`DEPARTMENT_MANAGER` anywhere in engine logic is forbidden. Renaming a step must be a cosmetic change with no behavioural effect, and that only holds if no code branches on the string.

### No React Flow coordinate columns, by design
There is no `x_position`, `y_position`, `config_json`, `allow_reject`, `allow_feedback`, or `is_required` column, and none may be added. The frontend renders the chain with React Flow, and dagre computes node positions client-side from the `parent_id` links — the same approach `frontend/src/features/organization/utils/organization-layout.ts` already uses for the org chart. Persisting coordinates would create a second source of truth for the diagram's shape: the stored positions would drift from the chain as steps were replaced, and every reader would then have to decide whether to trust the layout or the data. Deriving the layout means it cannot drift.

## Design

### Table
`workflow_steps`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `String` (uuid) | PK, `@default(uuid())` | |
| `workflowId` | `String` | not null, `@map("workflow_id")`, FK → `workflows.id`, `onDelete: Cascade` | Deleting a definition removes its chain. |
| `parentId` | `String?` | nullable, `@map("parent_id")`, self-FK → `workflow_steps.id`, `onDelete: Cascade` | `null` = root step. The chain source of truth. Cascade means deleting a step removes everything downstream of it, which is correct: a chain with a hole in it is not a chain. |
| `name` | `String` | not null, `@db.VarChar(255)` | Display label only. Never used for logic. |
| `organizationTypeId` | `String` | not null, `@map("organization_type_id")`, FK → `organization_types.id`, `onDelete: Restrict` | Who may act. `Restrict` because deleting an organization type that a live chain depends on would silently make its steps unactionable. |
| `stepOrder` | `Int` | not null, `@map("step_order")` | Display/tiebreak ordering only. Set to the array index by replace-chain. |
| `createdAt` | `DateTime` | not null, `@default(now())`, `@map("created_at")` | |
| `updatedAt` | `DateTime` | not null, `@updatedAt`, `@map("updated_at")` | |

### Relationships
- `WorkflowStep N—1 Workflow` via `workflow_id` (`ON DELETE CASCADE`).
- `WorkflowStep N—1 WorkflowStep` via `parent_id`, self-relation `WorkflowStepChain`, with the inverse `children` (`ON DELETE CASCADE`). Kept to at most one child by the replace-chain invariant, not by the database.
- `WorkflowStep N—1 OrganizationType` via `organization_type_id` (`ON DELETE RESTRICT`).
- `WorkflowStep 1—N WorkflowRequest` via `workflow_requests.current_step_id`, relation `WorkflowRequestCurrentStep` (`ON DELETE RESTRICT`).
- `WorkflowStep 1—N WorkflowHistory` via `workflow_histories.workflow_step_id` (`ON DELETE RESTRICT`).
- No `AuditLog` relationship — workflow entities opt out of the shared audit log (see `DB-WORKFLOW`).

## Validation
- `workflowId`: required, must reference an existing workflow.
- `organizationTypeId`: required, must reference an existing organization type.
- `name`: required, max 255 characters.
- Chain: minimum 1 step, maximum 20 per replace-chain call (contract §5.4). The 20-step cap pairs with the 20-hop cap on the organization ancestor walk in contract §4.2, which also guards against a cyclic `parentId` in `organizations`.
- `parentId` is never accepted as API input; it is derived from array position.

## Indexes
- Non-unique index on `workflow_id` (fetch a definition's chain).
- Non-unique index on `parent_id` (the APPROVE lookup: "the step whose parent is the current step").
- Non-unique index on `organization_type_id` (authority resolution and referential checks).

## Test Notes
- Migration creates `workflow_steps` with a UUID PK, the self-FK, and the cascade/restrict behaviour above.
- Replace-chain must set `steps[0].parentId = null` and each subsequent step's `parentId` to the preceding inserted step's `id`, with `stepOrder` equal to the array index.
- Replace-chain while a non-terminal request exists must fail with `409 WORKFLOW_HAS_ACTIVE_REQUESTS` and leave the existing chain untouched.
- Delete/insert must be one transaction — a failure partway must not leave a workflow with a truncated chain.
- Deleting a `Workflow` removes its steps; deleting an `OrganizationType` referenced by a step must be refused.
- Reordering `stepOrder` alone must not change any engine behaviour.

## Ambiguities
None blocking. Flagged, not silently decided:
- The one-child invariant is enforced only in the replace-chain service, not by a database constraint. A direct SQL insert could create a branch, and the engine's APPROVE lookup would then return more than one candidate "next" step. A partial unique index on `(parent_id)` where `parent_id IS NOT NULL` would enforce it in the database; it is not present, and adding one is a schema change outside this phase.
- A step can have zero eligible actors if no ancestor organization has its `organization_type_id`. The request legitimately stalls; this is intended (contract §4.3) and is not a data-integrity problem for this table.
