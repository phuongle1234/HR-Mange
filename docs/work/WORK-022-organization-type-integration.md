---
id: WORK-022
type: workflow
module: organization-type
status: draft
depends_on:
  - WORK-020
  - WORK-021
---

# WORK-022: OrganizationType Integration

## Work Status
`DRAFT` - blocked until backend and frontend implementation work items are complete.

## Summary
Verify the OrganizationType frontend against the real backend API, remove or disable any temporary mocks/stubs, and synchronize specs if implementation reveals a contract mismatch.

## Scope
In scope:
- Run backend and frontend together.
- Verify list, by-ids, create-many, update-many, and delete-many flows.
- Confirm frontend routes and sidebar navigation.
- Confirm bulk delete and update call the backend once per user action.
- Remove or disable frontend mock/stub adapters.
- Update specs if the final implementation differs from the contract.

Out of scope:
- New OrganizationType features not described in `WORK-019`.
- Reworking Employee or Organization chart flows.

## Dependencies
- `WORK-020`
- `WORK-021`
- Contract specs from `WORK-019`

## Test Plan
- Start backend and frontend.
- Login with a valid user.
- Visit `/organizations/types`.
- Create multiple organization types.
- Search/list organization types.
- Select multiple rows, navigate to update, load rows by ids, update them, and return to list.
- Select multiple rows, delete them through one confirmed API call, and confirm the list refreshes.
- Verify validation, conflict, not-found, and unauthorized error displays.

## Test Result
NOT RUN - blocked until implementation work is complete.

## Risks / Ambiguities
- Integration may reveal backend/frontend interpretation drift; resolve by updating specs and then code, not by leaving docs stale.
