# Employee bulk / Organization FK / Invitations parallel contract-first plan

## Context

Task source: `docs/09-workflow/daily-tasks/2026-08-26.md` (the SPEC — Employee, Invitation User và Organization task, §1-§38).

Goal: add bulk Create/Update/Delete to Employee (mirroring the existing OrganizationType pattern), link Employee to Organization and to User, build a new event-driven Invitations module with async email, and wire the Organization screen to a real API with an Organization Type FK. The user asked for this to be split so **two AI agents can work at the same time**: one backend, one frontend, both building from one already-completed contract (this plan + the spec files it points to).

## Important Existing Context

- This mirrors the exact split already used for OrganizationType (`docs/09-workflow/plans/organization-type-parallel-contract-plan.md`, `WORK-019`-`WORK-022`): one contract phase, then backend and frontend in parallel, then integration.
- Reused patterns confirmed present and ready to build on (recon done 2026-08-26): `BaseService<TDelegate, TQuery>` (`create`/`createMany`/`findOne`/`findByIds`/`update`/`updateMany`/`delete`/`deleteMany`, generic audit eventing); `@nestjs/event-emitter` already installed and wired (`EventEmitterModule.forRoot()`, `EventEmitter2` in every service, `AuditLogListener` as the existing `@OnEvent` consumer pattern); shared frontend primitives `ContextMenu`, `useGridInputNavigation`, `FullPageLoadingOverlay`, `ConfirmDialog`, `useListQueryState`, `useDebounce`, `SortableTableHeader`, `SearchAndFilterBar`; the `organizationTypeSelection` Redux slice as the exact template for a new `employeeSelection` slice.
- Genuinely new for this task: mail/SMTP infrastructure (no `nodemailer`/mailer package, no Mailpit container, no email-sending code anywhere yet); `react-select` (not a frontend dependency yet); the `invitations` backend module and `Invitation` Prisma model (zero prior references anywhere in the codebase).
- The Organization backend module already has real bulk endpoints (`GET`/`POST`/`PATCH`/`DELETE /organizations`) but they were never written up under `docs/06-api/` — this plan's contract phase closes that gap in addition to adding `organizationTypeId`.

## Contract (This Session — Completed 2026-08-26)

All contract-phase files are already written; backend and frontend agents read these instead of inventing shapes:

**Database:**
- `docs/04-database/entities/employee.md` — `organizationId` (nullable, `int4`, FK → `organizations.id`, `ON DELETE SET NULL`), `userId` (nullable, unique, `uuid`, FK → `users.id`, `ON DELETE SET NULL`).
- `docs/04-database/entities/organization.md` — `organizationTypeId` (nullable, `uuid`, FK → `organization_types.id`, `ON DELETE RESTRICT`), additive alongside the existing `type` enum.
- `docs/04-database/entities/invitation.md` — new `Invitation` entity, full field/status-lifecycle spec.
- `docs/04-database/relationships.md`, `docs/04-database/indexes.md`, `docs/04-database/architecture.md` — updated for all of the above.

**API:**
- `docs/06-api/employee/bulk-create-employees.md`, `bulk-update-employees.md`, `bulk-delete-employees.md`, `get-employees-by-ids.md` — new, at `/api/employees/bulk` and `/api/employees/by-ids`, additive alongside the existing single-record endpoints.
- `docs/06-api/organization/list-organizations.md`, `create-organizations.md`, `update-organizations.md`, `delete-organizations.md` — new, documenting the existing real bulk endpoints plus the new `organizationTypeId` field.
- `docs/06-api/invitations/create-invitations.md` (`POST /api/invitations`) and `accept-invitation.md` (`POST /api/auth/invitations/accept`) — new.
- `docs/06-api/conventions.md`, `docs/06-api/error-response.md` — updated with the new URL/error-code conventions.

**Frontend:**
- `docs/07-frontend/pages/employee-list.md` — checkbox multi-select, `ContextMenu` (Create/Update/Delete/Invite User), bulk delete, `employee_checked` Redux handoff.
- `docs/07-frontend/pages/employee-create.md` / `employee-edit.md` — rewritten as a bulk table editor (mirrors `organization-type-create.md`/`-update.md`) with a `react-select` Organization column; `employee-edit.md` now documents the `/employees/update` route replacing `/employees/:id/edit`.
- `docs/07-frontend/pages/organization-chart.md` — real API wiring (was frontend-only stub) plus an Organization Type `react-select` field.
- `docs/07-frontend/pages/invitation-accept.md` — new, `/invitation/accept?token=...`.
- `docs/07-frontend/architecture.md`, `api-client.md`, `react-route.md` — updated for all of the above.

Backend and frontend agents must treat these files as the source of truth, not each other's source code or this plan's prose — this plan only orients; the specs above are the actual contract.

## Parallelization Principle

```text
Contract (this plan + the spec files above — DONE)
    |-- Backend agent implements NestJS/Prisma to match the DB/API specs
    |-- Frontend agent implements React UI/API services/hooks to match the API/frontend specs
```

Backend must not change response/request shapes without first updating the relevant `docs/06-api/*.md` file. Frontend must not invent endpoints/fields outside the documented contract; if something is missing, it records ambiguity and asks rather than guessing against backend source.

## Agent A: Backend (`WORK-024`)

### Required Spec Read Set
`docs/00-project`, `docs/01-business`, `docs/02-solution`, `docs/03-technology`, `docs/04-database` (especially the four files touched above), `docs/06-api` (especially `employee/bulk-*`, `organization/*`, `invitations/*`), this plan.

### Prisma / Migration
- Add `Employee.organizationId`, `Employee.userId` and their relations; add `Organization.organizationTypeId` and its relation; add the `Invitation` model and `InvitationStatus` enum. One migration (or a small ordered set) covering all three, per `docs/04-database/entities/invitation.md`'s FK/cascade specifics — must not lose existing data (nullable FKs, no forced backfill).

### Employee Bulk Module
- `backend/src/modules/employee/controller/employee.controller.ts`: add `POST /bulk`, `PATCH /bulk`, `DELETE /bulk`, `POST /by-ids` alongside the existing single-record routes (do not remove them).
- New DTOs (`BulkCreateEmployeesDto`, `BulkUpdateEmployeesDto`, `BulkDeleteEmployeesDto`, `GetEmployeesByIdsDto`) per the API specs, reusing `IEmployeeService`'s inherited `BaseService` methods (`createMany`/`updateMany`/`deleteMany`/`findByIds`) — per `AGENTS.md`'s Mandatory BaseService Reuse Rule, do not recreate what `BaseService` already provides.
- Validate `organizationId` FK existence per `bulk-create-employees.md`/`bulk-update-employees.md`.

### Organization Module
- Add `organizationTypeId` to `CreateOrganizationDto`/`UpdateOrganizationDto`/`OrganizationFilterDto`, validated per the new `docs/06-api/organization/*.md` files.

### Invitations Module (new)
- `backend/src/modules/invitations/` — `InvitationsController`, `InvitationsService`, DTOs, following `docs/06-api/invitations/create-invitations.md`'s exact flow (load → partition valid/skipped → transaction → commit → per-invitation `invitation.created` event, published only after commit).
- Token generation: `crypto.randomBytes`, hashed before persisting (never store the raw token).
- `InvitationCreatedEvent` (`invitationId`, `employeeId`, `email`, `employeeName`, `invitationUrl`) — a dedicated event class, not the shared `EntityCrudEvent`, since it carries the one-time URL that must never be logged/persisted.
- `InvitationMailListener` (`@OnEvent('invitation.created', { async: true })`) calls `MailService.sendInvitation(...)` and updates `status`/`sentAt`/`sendAttempts`/`lastSendError` per `docs/04-database/entities/invitation.md`'s Status Lifecycle.
- Accept-invitation endpoint (`POST /api/auth/invitations/accept`) per `docs/06-api/invitations/accept-invitation.md` — implementation placement (extending `AuthController` vs. a new controller mounted at that path) is the backend agent's call; the route/request/response contract is fixed.

### Mail Infrastructure (new)
- Add a mail package (e.g. `nodemailer`) and a small `MailModule`/`MailService`/`MailProvider` abstraction (task §19: local `Mailpit`/SMTP provider now, swappable for Mailjet/real SMTP later via `MAIL_PROVIDER`/`MAIL_HOST`/`MAIL_PORT`/`MAIL_FROM` env vars, per task §29).
- Add a Mailpit (or equivalent) service to `infra/docker-compose.yml` for local dev (SMTP `1025`, web UI `8025`, per task §29). Update `docs/03-technology/infrastructure.md` and `.env.example` accordingly. Do not commit real Mailjet credentials — placeholders only, per task §29's explicit instruction.

### Constants / Audit
- Add `INVITATION_CREATED`/`INVITATION_UPDATED`/`INVITATION_DELETED` to `AuditAction`, `INVITATION` to `AuditEntityType`, and add one lookup row to `AuditLogListener` — no new listener class, matching the existing generic pattern.
- Add the new error codes from `docs/06-api/error-response.md`'s 2026-08-26 sections to `backend/src/common/constants/error-code.constant.ts` and the corresponding exception classes.

### Backend Agent Boundary
Backend may implement DTOs/Prisma/services/controllers/mail infra/migrations. Backend must not change frontend page behavior, invent Redux shape, or change any API response/request shape without updating the matching `docs/06-api/*.md` file first.

## Agent B: Frontend (`WORK-025`)

### Required Spec Read Set
`docs/00-project`, `docs/01-business`, `docs/02-solution`, `docs/03-technology`, `docs/05-ui-ux`, `docs/06-api` (same set as backend), `docs/07-frontend` (especially the five files touched above), this plan.

### react-select Compatibility Check (do this first, task §5.5)
`npm view react-select peerDependencies`, then `npm install react-select@5.10.2`, then `npm run build`. Report any real React 19 incompatibility before substituting a different library — do not silently swap and do not downgrade React.

### Employee List
- `frontend/src/features/employee/pages/EmployeeListPage.tsx`: add checkbox column (header check-all/indeterminate), remove per-row Edit/Delete buttons (keep Detail), add `ContextMenu` (Create/Update/Delete/Invite User), bulk delete via `DELETE /api/employees/bulk`, invite via `POST /api/invitations`. New `frontend/src/store/employeeSelection/employeeSelectionSlice.ts` mirroring `organizationTypeSelectionSlice.ts` exactly (`employee_checked` key), registered in `store/index.ts`.

### Employee Create / Update (bulk table editor)
- Rewrite `EmployeeCreatePage.tsx` as a `useFieldArray` table editor per `docs/07-frontend/pages/employee-create.md`, including a `react-select` Organization column (options loaded once via `GET /api/organizations`, never per-row).
- New `EmployeeUpdatePage.tsx` at route `/employees/update`, reading `employee_checked` from Redux, calling `POST /api/employees/by-ids` then `PATCH /api/employees/bulk`, per `docs/07-frontend/pages/employee-edit.md`. Remove `/employees/:id/edit` and `EmployeeEditPage.tsx`.
- Update `frontend/src/routes/app.routes.tsx` accordingly.

### Organization Real API Wiring
- Replace `frontend/src/features/organization/services/organization.api.ts`'s stub methods with real `baseApiService`/`ApiEndpoints` calls per `docs/06-api/organization/*.md`. Replace `useOrganizationStage`'s local-only state with TanStack Query (`useQuery` for list, `useMutation` for create/update/delete).
- Add an `organizationTypeId` `react-select` field to `CreateOrganizationModal.tsx`/`EditOrganizationModal.tsx`, sourced from `GET /api/organization-types`, alongside (not replacing) the existing `type` enum select.
- Add an `organizations` namespace to `frontend/src/shared/api/api-endpoints.ts` (currently absent).

### Invitation Accept Page (new)
- `frontend/src/features/auth/pages/InvitationAcceptPage.tsx` at route `/invitation/accept`, per `docs/07-frontend/pages/invitation-accept.md` — Password/Confirm Password form, `POST /api/auth/invitations/accept`, redirect to `/login` on success.
- Add the route to `app.routes.tsx` under `AuthLayout`, ungated (not `AuthGuard`, not `PublicOnlyGuard`).

### Invitations Service (new, small)
- `frontend/src/features/invitations/services/invitations.api.ts` (`createMany`) + `hooks/useCreateInvitationsMutation.ts`, consumed only by `EmployeeListPage`.

### Frontend Agent Boundary
Frontend may implement routes/pages/components/hooks/schemas/services against the documented contract, including temporary mock/fixture adapters if the backend isn't ready yet. Frontend must not inspect backend source as the source of truth, invent fields missing from the API spec, store server data in Redux, or call Axios directly from components.

## Recommended Work Items

| Work ID | Owner | Scope |
| --- | --- | --- |
| `WORK-023` | Contract | Employee bulk / Organization FK / Invitations database, API, and frontend contract specs (this plan + the spec files it lists) |
| `WORK-024` | Backend | Employee bulk endpoints, Organization `organizationTypeId`, Invitations module + mail infra + Mailpit, accept-invitation endpoint |
| `WORK-025` | Frontend | Employee List multi-select/invite, Employee bulk Create/Update table editor with `react-select`, Organization real API wiring + Organization Type select, Invitation Accept page |
| `WORK-026` | Integration | Verify frontend against real backend; run the task's own Validation checklist (§38) end-to-end; remove any temporary frontend mocks |

Dependency graph:

```text
WORK-023
  |-- WORK-024
  |-- WORK-025
WORK-024 + WORK-025 -> WORK-026
```

`WORK-024` and `WORK-025` can run fully in parallel — both depend only on the completed `WORK-023` contract, the same relationship `WORK-020`/`WORK-021` had to `WORK-019` for OrganizationType.

## Acceptance Criteria
- Database/API/frontend specs fully describe every new/changed endpoint, field, and page behavior (done, this session).
- Backend implements the contract exactly, without changing any documented shape silently.
- Frontend compiles and matches the documented contract; the `react-select` compatibility check is run and reported before it's relied on.
- Employee bulk create/update/delete work end-to-end, reusing `BaseService` per the project's Mandatory BaseService Reuse Rule.
- Invitation create → async mail send → accept flow works end-to-end against a local Mailpit instance, matching the task's own Validation checklist (§38).
- Organization Create/Edit modals persist to the real database instead of local-only state.
- `docs/09-workflow/session-context.md` is updated after each of `WORK-024`/`WORK-025`/`WORK-026`.

## Stop Point
This plan and every spec file it references are already written (this is a completed contract, not a proposal awaiting approval — the user explicitly asked for the spec and parallel work items to be created). Per project Planning Rules, `WORK-024`/`WORK-025` implementation itself still requires a separate, explicit go-ahead from the user before any backend/frontend agent starts writing code.
