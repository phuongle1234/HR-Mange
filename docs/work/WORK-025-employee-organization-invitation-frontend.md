---
id: WORK-025
type: workflow
module: employee-organization-invitation
status: draft
depends_on:
  - WORK-023
---

# WORK-025: Employee Bulk / Organization FK / Invitations Frontend

## Work Status
`APPROVED` - ready for a frontend AI agent to implement after reading the required specs. Per project Planning Rules, this is contract-approved, not code-authorized — implementation still requires a separate, explicit user go-ahead in the implementing session before any file is written.

## Summary
Implement the React frontend for Employee List multi-select/Invite User, the Employee bulk Create/Update table editor with a `react-select` Organization column, real Organization API wiring with an Organization Type select, and a new Invitation Accept page, according to the completed contract in `WORK-023`. This work can run in parallel with `WORK-024` because both depend only on `WORK-023`.

## Scope
In scope:
- `EmployeeListPage.tsx`: checkbox multi-select (header check-all/indeterminate), `ContextMenu` (Create/Update/Delete/Invite User), bulk delete, `POST /api/invitations` invite call. New `employeeSelection` Redux slice mirroring `organizationTypeSelectionSlice.ts`.
- `EmployeeCreatePage.tsx`: rewritten as a `useFieldArray` bulk table editor, including a `react-select` Organization column (options loaded once, reused across rows).
- New `EmployeeUpdatePage.tsx` at `/employees/update` (replaces `/employees/:id/edit`/`EmployeeEditPage.tsx`), reading `employee_checked` from Redux.
- Organization feature (`frontend/src/features/organization/`): replace `services/organization.api.ts`'s stub methods with real API calls; replace `useOrganizationStage`'s local-only state with TanStack Query; add an `organizationTypeId` `react-select` field to both Create/Edit modals.
- New Invitation Accept page (`frontend/src/features/auth/pages/InvitationAcceptPage.tsx`) at `/invitation/accept`.
- New small `invitations` feature (API service + mutation hook) consumed by Employee List.
- `frontend/src/routes/app.routes.tsx`, `frontend/src/shared/api/api-endpoints.ts` (new `organizations`/`invitations` namespaces), `frontend/src/store/index.ts` (register the new selection slice) updated accordingly.

Out of scope:
- NestJS/backend implementation (`WORK-024`).
- Changing the Employee Detail page's read-only behavior beyond what's needed to keep it compiling against any shared type changes.
- Runtime integration testing against a real backend (`WORK-026`).

## Dependencies
Required specs to read before coding:
- `docs/00-project/*`
- `docs/01-business/*`
- `docs/02-solution/*`
- `docs/03-technology/*`
- `docs/05-ui-ux/*`
- `docs/06-api/*`
- `docs/07-frontend/*`
- `docs/09-workflow/plans/employee-organization-invitation-parallel-plan.md`
- `docs/work/WORK-023-employee-organization-invitation-contract.md`

Primary contract specs:
- `docs/07-frontend/pages/employee-list.md`, `employee-create.md`, `employee-edit.md`, `organization-chart.md`, `invitation-accept.md`
- `docs/06-api/employee/bulk-*.md`, `get-employees-by-ids.md`
- `docs/06-api/organization/*.md`
- `docs/06-api/invitations/*.md`

## Implementation Notes
- **Do the `react-select` compatibility check first** (task §5.5): `npm view react-select peerDependencies`, then `npm install react-select@5.10.2`, then `npm run build`. Report any real React 19 incompatibility before substituting a different library or downgrading React — neither is authorized silently.
- Organization/Organization Type select options must be fetched once per page (or once per modal open) and reused across every row/field — never fetched per row (task §5.15, explicit performance rule, applies to both the Employee bulk editor and the Organization modals).
- `Organization.id` is a **number**, not a UUID string — the `react-select` option `value`/form field type must be `number | null` wherever it appears (Employee's `organizationId` column, and nowhere else needs it since `OrganizationType.id` stays a UUID string as before).
- Changing one table row's or one modal's select value must only update that row/field, never any other row (task §5.8, explicit).
- The `employee_checked` Redux slice must mirror `organizationTypeSelectionSlice.ts`'s exact shape (`{ field: 'employee_checked', value: string[] }`, `setEmployeeCheckedIds`/`clearEmployeeCheckedIds`).
- `/invitation/accept` must not be behind `AuthGuard` or `PublicOnlyGuard` — see `FRONTEND-INVITATION-ACCEPT`'s Route Reference for why.
- Components must not call Axios directly or hard-code `/api/...` — all new endpoints go through `ApiEndpoints`.

## Test Plan
- Do not create or run unit tests unless the user explicitly asks for UT in the implementation request.
- Recommended manual verification when implementation is requested:
  - run `npm run build`
  - manually exercise: Employee List multi-select → bulk delete, multi-select → Invite User, bulk Create with an Organization selected per row, bulk Update prefilled from selection
  - manually exercise: Organization Create/Edit modals actually persisting to the database (not just local state)
  - manually exercise: `/invitation/accept` with a valid token (requires backend/`WORK-024` running) and with a missing/invalid token

## Test Result
NOT RUN - frontend implementation not started.

## Risks / Ambiguities
- Whether the Employee List/Detail pages should display the employee's Organization name is not specified by the daily task and is left out of this work item's scope (see `FRONTEND-EMPLOYEE-CREATE`'s Ambiguities).
- If the backend (`WORK-024`) isn't finished yet when this work starts, a temporary mock/fixture adapter may be used per `FRONTEND-ARCHITECTURE`'s existing rule for OrganizationType — it must be removed once `WORK-026` integration begins, not left as permanent shipped behavior.
- Existing unrelated worktree changes were present while this item was created and were not touched.
