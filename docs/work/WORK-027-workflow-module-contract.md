---
id: WORK-027
type: workflow
module: workflow
status: draft
depends_on: []
---

# WORK-027: Workflow Module Contract Specs

## Work Status
`IMPLEMENTED` - contract, master spec, and integration plan were created so three AI agents can build the Workflow Module in parallel from one frozen source of truth.

## Summary
Design a configurable, database-driven approval workflow module reusable across business flows, with leave request (Đăng ký nghỉ phép) as the first use case. This work item is the coordination point for `WORK-028`/`WORK-029`/`WORK-030`: all three read these specs instead of depending on each other's source code.

The defining requirement: **the approval chain must be configurable by data alone.** Adding Director and CEO above Department Manager must be data entry — no engine code change, no migration, no redeploy.

## Scope
In scope:
- Repository inspection to ground the design in the real architecture (backend module/BaseService pattern, frontend feature/React Flow pattern, shared files, existing conventions).
- Frozen shared contract: enums, five entities, `form_schema`/`form_data` rules, approver-resolution algorithm, REST API and DTO shapes, error codes, state machine, transaction/concurrency rules, socket events/payloads/rooms, notification generation rules, file ownership, frontend routes, query keys, mock strategy.
- Master spec explaining what is built and why each design decision was taken.
- Integration plan: dependency graph, branch strategy, merge order, shared-file conflict analysis, integration procedure, manual verification flows.
- Three parallel work items with non-overlapping file ownership.

Out of scope:
- Any implementation code (`WORK-028`/`029`/`030`).
- Prisma schema and migration (`WORK-028`).
- Automated tests of any kind — explicitly excluded by the task brief. Manual verification flows are in the integration plan.
- Changes to `UserMenu`, Change Password, or Logout.

## Dependencies
- Specs: `docs/09-workflow/plans/workflow-module/workflow-contract.md`, `workflow-master-spec.md`, `workflow-integration-plan.md`.
- Reference patterns inspected: `backend/src/modules/organization-type/` (module/controller/interface/service), `backend/src/modules/invitations/` (domain event + async listener), `frontend/src/features/organization-type/` (feature layout), `frontend/src/features/organization/utils/organization-layout.ts` (React Flow + dagre).
- Prior precedent for this parallel-contract pattern: `WORK-019`-`WORK-022` (OrganizationType), `WORK-023`-`WORK-026` (Employee/Invitation).

## Implementation Notes
Two repository findings materially shaped the design and are resolved in the contract rather than left to the agents:

**No manager/lead/head field exists anywhere.** Neither `Employee` nor `Organization` records a person in charge, and `OrganizationType` has no level or rank column. "Who is this employee's Team Lead" is therefore unanswerable as a person lookup. Approval authority is **organization-scoped**: the actor's organization must carry exactly the step's `organizationTypeId` **and** be an ancestor-or-self of the requester's organization (walking `Organization.parentId`, capped at 20 hops against cyclic data). Full algorithm in contract §4.

**`BaseService` has no transaction-aware method** and the codebase contains zero `$transaction` usages, yet every workflow action must atomically write history + request + notification across three tables. Resolved in contract §8.3: the action-engine service may use `prisma.$transaction` for that one atomic write while every other read/write still goes through inherited base methods. Extending `BaseService` generically is out of scope — it would change a class every module depends on, mid-parallel-work.

Other resolved decisions:
- Exactly four workflow tables + one notification table. No React Flow coordinate columns — dagre computes positions client-side, as the existing org chart already does.
- The step chain is a **linked list** (one child per step), enforced by the replace-chain API assigning `parent_id` from array order. This is what makes "FEEDBACK descends exactly one level" unambiguous; in a branching tree the previous step would not be unique.
- `workflow_requests.revision` added as an optimistic-lock token beyond the brief's field list, because concurrency safety (two simultaneous approvals) cannot be met without one. The loser receives `409 WORKFLOW_REQUEST_STALE`.
- Workflow entities opt out of the shared audit log (`entityType: null`) because `workflow_histories` is already a richer immutable trail; nothing is added to `AuditEntityType`/`AuditAction`/`AuditLogListener`.
- Notification recipients are **sets**, not individuals — a direct consequence of organization-scoped authority — resolved by the same function as the permission check so the two can never diverge.
- Conflict elimination: Agent 1 single-pass edits `schema.prisma`, `app.module.ts`, `error-code.constant.ts`, and `app.exception.ts` **including Agent 2's entries**, leaving `workflow.module.ts` as the only file needing a manual touch at integration.

## Test Plan
- No runtime tests for this spec-only work item.
- Review the specs for: endpoint/DTO consistency between contract and agent tasks, error-code consistency, socket event/payload/query-key alignment across Agents 2 and 3, absence of overlapping file ownership, and absence of blocking ambiguity.

## Test Result
NOT RUN - spec-only work item; no implementation tests were requested or permitted.

## Risks / Ambiguities
Flagged for the Tech Lead, none blocking the agents from starting (full list in the integration plan's Open Items):
- **Unresolved business rule:** may a requester approve their own request at a step whose organization type they happen to match? The brief does not say and the contract does not forbid it. Needs a ruling before production use.
- A step with zero eligible approvers stalls visibly by design; the contract forbids auto-skip/auto-approve/admin-fallback, because silent escalation of an approval is worse than a visible stall an administrator can fix.
- `revision` and the narrow `$transaction` exception are both deliberate additions beyond the brief; both are recorded as Tech Lead decisions and need confirmation.
- The worktree was dirty when this item was written (partial `WORK-024`/`WORK-025`); it must be committed or stashed before the three agent branches are cut, or each branch carries unrelated half-finished work.
- `WORK-024` is incomplete (no accept-invitation endpoint, no Mailpit container), so creating login accounts for the integration plan's five test employees may require direct database work until that lands.
