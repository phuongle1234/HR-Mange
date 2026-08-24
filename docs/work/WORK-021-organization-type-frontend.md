---
id: WORK-021
type: workflow
module: organization-type
status: draft
depends_on:
  - WORK-019
---

# WORK-021: OrganizationType Frontend

## Work Status
`IMPLEMENTED` - frontend implementation is complete and builds successfully.

## Summary
Implement the React frontend for OrganizationType list/create/update pages against the completed API contract. This work can run in parallel with `WORK-020`; the frontend agent should not wait for backend source code.

## Scope
In scope:
- Add shared `ContextMenu`.
- Add shared `useGridInputNavigation`.
- Add shared `FullPageLoadingOverlay`.
- Add OrganizationType feature types, schemas, services, query keys, hooks, and pages.
- Add routes and sidebar item under Organization.
- Add Redux selection handoff for checked ids using key `organization_type_checked`.
- Use mock/stub API data only as a temporary dev adapter if backend is unavailable.

Out of scope:
- NestJS/Prisma implementation.
- Changing the API contract.
- Persisting server data in Redux.
- Storing form values in Redux.

## Dependencies
Required specs to read before coding:
- `docs/00-project/*`
- `docs/01-business/*`
- `docs/02-solution/*`
- `docs/03-technology/*`
- `docs/05-ui-ux/*`
- `docs/06-api/*`
- `docs/07-frontend/*`
- `docs/09-workflow/plans/organization-type-parallel-contract-plan.md`
- `docs/work/WORK-019-organization-type-api-contract.md`

Primary contract specs:
- `docs/06-api/organization-type/*.md`
- `docs/07-frontend/pages/organization-type-list.md`
- `docs/07-frontend/pages/organization-type-create.md`
- `docs/07-frontend/pages/organization-type-update.md`
- `docs/07-frontend/api-client.md`
- `docs/07-frontend/react-route.md`

## Implementation Notes
- Components must not hard-code `/api/...`; use centralized `ApiEndpoints`.
- Feature service shape:
  - `list(query)`
  - `findByIds({ ids })`
  - `createMany({ items })`
  - `updateMany({ items })`
  - `deleteMany({ ids })`
- List page:
  - route `/organizations/types`
  - local checked ids until Update is selected
  - context menu items Create/Update/Delete
  - delete calls API once with `{ ids }`
- Create page:
  - route `/organizations/types/create`
  - table-form rows with React Hook Form + Zod
  - context menu Submit/Create items/Delete
  - arrow-key input focus navigation
- Update page:
  - route `/organizations/types/update`
  - read Redux key `organization_type_checked`
  - call by-ids endpoint once
  - submit all edited rows in one update call

## Test Plan
- Do not create or run unit tests unless the user explicitly asks for UT in the implementation request.
- Recommended manual verification when implementation is requested:
  - run TypeScript build
  - run frontend dev server
  - exercise list/create/update page flows with mock/stub or backend API
  - verify context menu and arrow-key navigation

## Test Result
BUILD PASSED - `npm run build` in `frontend/` completed successfully.

Unit tests were not created or run because the user did not explicitly request UT for this implementation request.

## Risks / Ambiguities
- Existing frontend Employee/shared files have unrelated worktree changes. Do not revert them.
- If backend is unavailable, temporary mock/stub behavior must remain isolated from final page logic and easy to remove in `WORK-022`.
