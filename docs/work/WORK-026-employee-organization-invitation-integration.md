---
id: WORK-026
type: workflow
module: employee-organization-invitation
status: draft
depends_on:
  - WORK-024
  - WORK-025
---

# WORK-026: Employee Bulk / Organization FK / Invitations Integration

## Work Status
`DRAFT` - blocked until backend (`WORK-024`) and frontend (`WORK-025`) implementation work items are complete.

**Parked 2026-08-28** at the user's decision: `WORK-024`, `WORK-025`, and this item are deliberately pending and will be resumed later. Work moved on to the Workflow Module (`WORK-027`-`WORK-031`). `WORK-024` is partially implemented in the worktree — Employee bulk endpoints, Organization FK, and the Invitations module exist, but the accept-invitation endpoint, the Mailpit container, and the `.http` files do not. Do not assume any part of this group is finished.

## Summary
Verify the frontend against the real backend API end-to-end, run the daily task's own Validation checklist (`docs/09-workflow/daily-tasks/2026-08-26.md` §38), remove or disable any temporary mocks/stubs, and synchronize specs if implementation reveals a contract mismatch.

## Scope
In scope:
- Run backend and frontend together, including a local Mailpit instance.
- Verify Employee bulk create/update/delete and by-ids flows, including the Organization `react-select` column.
- Verify Employee List multi-select, bulk delete, and Invite User (created/skipped counts).
- Verify Organization Create/Edit modals persist to the real database, including the Organization Type select and FK validation.
- Verify the full invitation flow: create → async email arrives in Mailpit → accept with a valid token → new `User` created → `employee.userId` set → invitation `status` reaches `ACCEPTED`.
- Verify rejection paths: expired token, already-accepted token, invalid token, an employee that already has `userId`.
- Confirm frontend routes (`/employees/update`, `/invitation/accept`) and the removal of `/employees/:id/edit`.
- Remove or disable frontend mock/stub adapters used during parallel development.
- Update specs if the final implementation differs from the contract.

Out of scope:
- New features not described in `WORK-023`.
- Automatic invitation retry / scheduled expiry sweep (out of scope per the daily task itself, §23).
- Reworking Employee Detail page behavior.

## Dependencies
- `WORK-024`
- `WORK-025`
- Contract specs from `WORK-023`

## Test Plan
Mirrors the daily task's own Validation section (§38) plus the parallel-contract pattern's usual integration pass:
- Start backend, frontend, and Mailpit together.
- Login with a valid user.
- Employee: create with Organization selected via `react-select`, update Employee Organization via bulk update, bulk create, bulk update, bulk delete.
- Invitation: invite one employee successfully, invite several at once, invite an employee with no email (skipped), invite an employee that already has `userId` (skipped), verify the mail actually arrives in Mailpit, create a User via accept, verify an invalid token is rejected, verify an expired token is rejected, verify an already-accepted token is rejected, verify mail-send failure does not roll back the invitation row.
- Organization: create, update, valid `organizationTypeId`, invalid `organizationTypeId` rejected, modal loads Organization Type options, list refreshes after create/edit.
- Verify validation, conflict, not-found, and unauthorized error displays across all of the above.

## Test Result
NOT RUN - blocked until implementation work is complete.

## Risks / Ambiguities
- Integration may reveal backend/frontend interpretation drift (e.g. the `/employees/:id/edit` removal assumption in `WORK-023`'s Risks section); resolve by updating specs and then code, not by leaving docs stale.
- Mail delivery verification depends on the Mailpit container from `WORK-024` actually being wired into local dev — if it isn't, this item is blocked on that infrastructure piece specifically, not just the application code.
