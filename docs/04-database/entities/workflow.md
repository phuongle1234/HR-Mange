---
id: DB-WORKFLOW
type: database
module: workflow
status: draft
---

# Workflow Entity

Source: `docs/09-workflow/plans/workflow-module/workflow-contract.md` §§2.1, 3 (frozen contract, `WORK-027`), as implemented in `backend/prisma/schema.prisma`. This document describes what is actually in the schema, not a proposal.

## Purpose
Store one row per approval workflow *definition* — the reusable template an admin authors once (its business code, its form schema, its lifecycle status) and against which employees later submit `WorkflowRequest` rows. The step chain that defines who approves lives in `DB-WORKFLOW-STEP`; this entity owns the definition's identity and its form.

## Dependencies
- `DB-WORKFLOW-STEP`, `DB-WORKFLOW-REQUEST`, `DB-USER`, `DB-CONVENTIONS`
- Contract §§1.1, 1.5, 2.1, 3, 5.1

## Requirements
- `code` is the stable business key (e.g. `LEAVE_REQUEST`). It is unique and immutable after create — `PUT /api/workflows/:id` accepts `name`, `description`, `formSchema`, `status` only (contract §5.1). Renaming a workflow must never change what past requests were submitted against.
- Only `ACTIVE` workflows accept new requests. `DRAFT` is editable; `ARCHIVED` is read-only and hidden from the submit picker (contract §1.1).
- `version` is informational only in this phase. It is incremented when steps or the schema change, but a `WorkflowRequest` does **not** pin a version — there is no version column on the request. Versioning/pinning is explicitly out of scope (contract §15).
- Workflow entities opt **out** of the shared audit log. Their services pass `entityType: null` to `BaseService` (the sanctioned audit opt-out), and nothing is added to `AuditEntityType`, `AuditAction`, or `AuditLogListener`. The reason is not omission: `workflow_histories` is already a richer, domain-specific trail with the acting step and the actor's comment on it. Writing a second, thinner copy into `audit_logs` would produce two half-authoritative histories, and any later divergence between them would be unresolvable — neither could be trusted as the record.

## Design

### Table
`workflows`

### Fields
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `String` (uuid) | PK, `@default(uuid())` | Follows `DB-CONVENTIONS`. |
| `code` | `String` | `@unique`, `@db.VarChar(50)` | Stable business key, e.g. `LEAVE_REQUEST`. Immutable after create (API-enforced, not a DB constraint). |
| `name` | `String` | not null, `@db.VarChar(255)` | Human-facing title. |
| `description` | `String?` | nullable, `@db.Text` | |
| `formSchema` | `Json` | not null, `@map("form_schema")` | The field definitions of the form. See "form_schema vs form_data" below. |
| `status` | `WorkflowStatus` | not null, `@default(DRAFT)` | Values: `DRAFT`, `ACTIVE`, `ARCHIVED`. |
| `version` | `Int` | not null, `@default(1)` | Incremented on step/schema change. Informational; requests do not pin it. |
| `createdByUserId` | `String?` | nullable, `@map("created_by_user_id")`, FK → `users.id` | Prisma relation `WorkflowCreatedBy`. No `onDelete` override is declared, so Prisma's default for an optional relation applies (`SetNull`) — deleting the authoring user must not delete the workflow definition or the request history hanging off it. |
| `createdAt` | `DateTime` | not null, `@default(now())`, `@map("created_at")` | |
| `updatedAt` | `DateTime` | not null, `@updatedAt`, `@map("updated_at")` | |

There is no `updatedByUserId`, and no soft-delete column. There is also no coordinate or layout column of any kind — see `DB-WORKFLOW-STEP`, where that decision has its effect.

### `form_schema` vs `form_data`
Two different things, and the split is deliberate (contract §3):
- **`workflows.form_schema`** — *which fields the form has*. Authored by an admin when the workflow is defined. Shape is frozen: `{ "fields": [ { key, label, type, required?, options? } ] }`, where `key` matches `^[a-zA-Z][a-zA-Z0-9_]*$` and is unique within the schema, `type` is one of the six lower-case values in contract §1.5 (`text`, `textarea`, `number`, `date`, `select`, `checkbox`), and `options` is required and non-empty only when `type === "select"` and forbidden otherwise. Unknown properties are a `400`.
- **`workflow_requests.form_data`** — *what the employee typed*. A flat object keyed by the schema's `key` values, validated against the schema at SUBMIT and again at RESUBMIT.

Keeping them on separate tables is what lets the admin edit the form for future requests without rewriting what past requesters actually entered. A request's `form_data` is a record of a submission, not a view of the current schema.

### Relationships
- `Workflow 1—N WorkflowStep` via `workflow_steps.workflow_id` (`ON DELETE CASCADE`) — deleting a definition removes its chain.
- `Workflow 1—N WorkflowRequest` via `workflow_requests.workflow_id` (`ON DELETE RESTRICT`) — a workflow with any request, in-flight or historical, cannot be deleted.
- `Workflow N—1 User` via `created_by_user_id` (nullable).
- No `AuditLog` relationship, polymorphic or otherwise — see Requirements.

## Validation
- `code`: required, unique, max 50 characters. Rejected with `409 WORKFLOW_CODE_EXISTS` on duplicate at create.
- `name`: required, max 255 characters.
- `formSchema`: required, must satisfy the frozen shape in contract §3.1. Field errors use the granular path convention (`formData.<key>` for data; schema errors report the offending field index/key).
- `status`: one of `WorkflowStatus`; defaults to `DRAFT`. Submitting against a non-`ACTIVE` workflow is `400 WORKFLOW_NOT_ACTIVE`; against an `ACTIVE` workflow with an empty chain, `400 WORKFLOW_HAS_NO_STEPS`.

## Indexes
- Unique index on `code` (business-key lookup and duplicate detection).
- Non-unique index on `status` (list filtering and the active-workflow picker).

## Test Notes
- Migration creates `workflows` with a UUID PK, the `WorkflowStatus` enum, and the unique `code` constraint.
- Creating two workflows with the same `code` must fail the second time.
- `PUT` must not change `code`.
- Submitting a request against a `DRAFT` or `ARCHIVED` workflow must fail before any request row is written.
- Deleting a workflow that has any `WorkflowRequest` must be refused by the FK (`RESTRICT`), not silently cascade.
- Deleting a workflow with no requests must remove its `WorkflowStep` rows (cascade).

## Ambiguities
None blocking. Flagged, not silently decided:
- `version` has no consumer in this phase. It is incremented but never read for behaviour; if request-level version pinning is ever added, the semantics of already-existing rows will need a decision.
- There is no delete endpoint for workflows in this phase; the `RESTRICT` on requests describes the constraint that would apply if one were added.
