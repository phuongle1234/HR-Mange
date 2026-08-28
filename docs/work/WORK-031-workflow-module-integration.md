---
id: WORK-031
type: workflow
module: workflow
status: draft
depends_on:
  - WORK-028
  - WORK-029
  - WORK-030
---

# WORK-031: Workflow Module Integration

## Work Status
`DRAFT` - blocked until `WORK-028` (core backend), `WORK-029` (actions/events/socket/notification), and `WORK-030` (frontend) are complete.

## Summary
Merge the three parallel branches in order, swap every mock and temporary shim for the real implementation, verify the shipped code conforms to the frozen contract field-for-field, and walk the manual verification flows.

## Scope
In scope:
- Merge order: `WORK-028` → `WORK-029` → `WORK-030`, each rebased onto `main` before landing.
- Swap `WORK-029`'s temporary shims: local TS types → `@prisma/client` imports; temporary permission implementation → `WORK-028`'s exported function (**deleted, not left in place**); `form_data` validator shim → `WORK-028`'s export.
- Fill the `// TODO(WORK-029)` event-emission markers left in the submit path.
- Add the one manual module-wiring line to `workflow.module.ts`.
- Turn off `WORK-030`'s mock flag and delete its fixtures.
- Point the socket client at the real `/ws` namespace.
- Contract conformance check: response shapes, socket event names and payload keys, query keys, error codes and statuses.
- Review the `AppLayout.tsx` diff line by line to confirm `UserMenu`/Change Password/Logout are untouched.
- Manual verification flows (happy path, feedback descent, resubmit, reject, cancel, permission negatives, concurrency, notification/socket end-to-end, configurability, form validation, regression of untouched features).

Out of scope:
- New workflow features not described in `WORK-027`.
- Automated tests of any kind — explicitly excluded by the task brief.
- Resolving the open business-rule question about self-approval; that needs a Tech Lead ruling, recorded here as a blocker rather than decided during integration.

## Dependencies
- `WORK-028`, `WORK-029`, `WORK-030`
- `docs/09-workflow/plans/workflow-module/workflow-integration-plan.md` — the detailed procedure, checklist, test-data setup, and manual flows
- `docs/09-workflow/plans/workflow-module/workflow-contract.md` — the conformance reference

## Implementation Notes
- **Commit or stash the pre-existing dirty worktree before cutting the three branches.** At the time `WORK-027` was written, partial `WORK-024`/`WORK-025` work was uncommitted; branching on top of it would give each agent an unrelated half-finished change and produce conflicts that have nothing to do with workflow.
- After `WORK-028` merges, run `npx prisma generate` and **confirm** the generated client contains all five new models before the other branches rebase — a stale client is the most common cause of confusing downstream failures.
- Verify by grep that exactly **one** implementation of the approver-resolution rule remains. Two would be a security bug.
- Rollback is per-branch and additive: reverting the frontend leaves the APIs without UI; reverting actions leaves definitions and submit working; reverting core leaves orphan tables, which are harmless. Do **not** write a destructive down-migration.

## Test Plan
Manual only — the full flows are in `workflow-integration-plan.md` §7:
- Happy path: submit → three approvals → `APPROVED`, verifying history rows, `revision` increments, and inbox movement at each step.
- Feedback descending to root then resubmit, asserting the step pointer does **not** become `null` at the root.
- Reject and cancel as terminal actions, then confirming further actions return `409`.
- Permission negatives called directly against the API (wrong subtree, wrong type, non-requester resubmit, no `Employee`, null `organizationId`) — each must be refused by the backend, not merely hidden in the UI.
- Concurrency: two browsers approving simultaneously — exactly one succeeds, the other gets `409 WORKFLOW_REQUEST_STALE`, and `workflow_histories` contains exactly one approve row for that step.
- Notification/socket end-to-end including scoped delivery, no self-notification, and graceful socket loss/reconnect.
- Configurability: add two steps and walk a fresh request through five approvals with **no code change, no migration, no redeploy** — if code was needed, the module failed its objective.
- Regression: account menu, Change Password, Logout, employee/organization/organization-type screens all unchanged.

## Test Result
NOT RUN - blocked until implementation work is complete.

## Risks / Ambiguities
- **Open business rule:** may a requester approve their own request at a step whose organization type they match? Unspecified by the brief, unforbidden by the contract. Needs a ruling before production use; the integration test data deliberately places the requester and the step-1 approver in the same organization, which surfaces this case.
- Integration may reveal interpretation drift between agents; resolve by updating the contract and specs first, then the code — never by leaving the specs stale.
- `WORK-024` is incomplete (no accept-invitation endpoint, no Mailpit container), so creating login accounts for the five test employees may require direct database work until that lands.
- Confirm the two Tech Lead decisions taken in `WORK-027`: the added `revision` column, and the narrow `$transaction` exception to "all writes through `BaseService`".
