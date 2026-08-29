---
id: WORKFLOW-SESSION-CONTEXT
type: workflow
module: global
status: draft
---

# Session Context Log

This file is a cumulative summary of the work performed in the current repo state. It is rewritten after each significant task so it always reflects the full conversation state, not just the latest prompt.

## User Requests and Decisions

1. The user asked the agent to read the project rule file (`AGENTS.md`) and explain the workspace rules. The project was identified as a specification-first EmployeeOS / Employee Management System with explicit requirements for planning, specification-before-implementation, debugging boundaries, and session memory logging.

2. The user asked to reconstruct the project status from `docs/09-workflow/session-context.md`. The session summary confirmed that the repo already covered a broad effort across employee management, organization/organization-type features, auth, audit logging, infrastructure, and frontend shared list patterns.

3. The user later requested implementation work tied to the employee/organization/invitation frontend flow and explicitly said that a plan approval alone should not authorize coding. The repo is therefore treated as spec-first and implementation-safe only when the task is explicitly acted on.

4. The referenced task file `docs/work/WORK-025-employee-organization-invitation-frontend.md` was not present in this checkout, so the implementation was completed against the current repo state, the spec files under `docs/`, and the existing frontend feature patterns already in the codebase.

5. The user then asked to continue `WORK-024` backend from `docs/work/WORK-024-employee-organization-invitation-backend.md` without another confirmation. The agent started that backend task, read the required backend specs and work items, installed `nodemailer`/`@types/nodemailer`, added partial Prisma schema/migration changes for Employee/Organization/Invitation, and began Employee/Organization DTO/controller updates. Before the backend work was finished or verified, the user changed the active request to `WORK-025` frontend, specifically the "Organization Real API Wiring" scope. The backend changes remain partial worktree changes and are not a completed task.

6. The newest active request was to finish `WORK-025` frontend's Organization Real API Wiring because `organization.api.ts` and `ApiEndpoints.organizations` existed but `OrganizationPage.tsx` still used local `useOrganizationStage()` and Create/Edit modals still wrote only to local state.

7. The user reported a runtime backend error on `POST /api/organizations`: `TypeError: Cannot read properties of undefined (reading 'organizationType')` from `OrganizationTypeReferenceExistsConstraint.validate`, and asked to remove the **Type** column/field from Organization.

8. The user pasted a new instruction document titled "AI Project History and Audit Trail Architect" and asked what the agent understands from it. The document describes a JSONL-based project history/audit system that is separate from specs, rules, memory, and session context. The user has not yet asked to implement it.

9. The user clarified the desired direction: keep memory simple and focused on information future agents need to remember, such as where rules/specs live and what the frontend/backend/coding rules are. The user does not want a new `.ai/` directory structure. History should remain simple chronological logs named `YYYY-MM-DD.jsonl`; the user said that JSONL history has already been built.

10. The user then explicitly asked to build that lightweight memory/history workflow and add a standing rule that after each working session the agent must update memory and history.

11. (Concurrent session, same day) The user asked why `InvitationsService` did not extend `BaseService` and what the project's backend architecture rule actually requires. After the explanation, the user rejected the reasoning and instructed that `Controller -> Interface/Abstraction -> Service -> BaseService -> Prisma -> PostgreSQL` is **mandatory with no exceptions**, and that `InvitationsService` must extend `BaseService` but be designed so it does not emit audit events like other modules.

12. The user asked that on the frontend `/organizations/types` page, clicking a row's delete icon must show a confirmation popup first, and only call the delete API after the user confirms.

13. The user asked what the project rules require after each working session. The agent read `AGENTS.md` and reported the three obligations (session context, memory, daily JSONL history) and flagged that the current session had not yet done any of them.

14. The user asked what the scripts under `docs/09-workflow/scripts/` are for. The agent read all three and explained them. The user then asked whether the agent would have known to run them on its own; the agent said no — `AGENTS.md` describes only the JSONL file format/location and never names the scripts, so an agent reading only the rules would hand-write JSONL and lose the automatic secret redaction and `event_type` validation. The user then asked to document the scripts in memory so other AI agents know how to use them.

## Earlier Conversation Context Recovered After Overwrite

`docs/09-workflow/session-context.md` was overwritten by a concurrent session with a shorter summary, which dropped the cumulative record of work completed earlier on 2026-08-26. `AGENTS.md` requires this file to be cumulative and self-sufficient, so the dropped items are restored here in condensed form (full detail remains in the specs and work items themselves):

- **JWT RS256 migration (2026-08-26).** Backend JWT signing moved from a symmetric `JWT_ACCESS_SECRET` (implicit HS256) to an RSA key pair with `RS256` pinned on both signing (`JwtModule.registerAsync`) and verification (`JwtStrategy`). `AppConfig.jwt` exposes `privateKey`/`publicKey` (PEM, `\n` unescaped) instead of `accessSecret`. Real keys live only in the gitignored `backend/.env`; `.env.example` carries empty placeholders. Verified live against the seeded admin user: valid token accepted, and payload-tampered / different-key / HS256-signed / missing tokens all rejected `401`. Documented in `docs/06-api/authentication.md` ("Token Signing").
- **`API-AUTH-ME` spec sync.** `@Get('me')` returns the guard-verified `{ id, email, fullName }` payload directly instead of re-querying via `authService.getCurrentUser(user.id)` — one fewer redundant DB fetch per request, response contract unchanged. This was a pre-existing working-tree change the agent documented rather than authored.
- **`WORK-023` contract (2026-08-26), status `IMPLEMENTED`, spec-only.** Full database/API/frontend contract for the 2026-08-26 daily task so a backend agent and a frontend agent could work in parallel: `Employee.organizationId`/`userId`, `Organization.organizationTypeId`, the new `Invitation` entity, Employee bulk endpoints at `/api/employees/bulk` + `/api/employees/by-ids`, first-ever write-up of the existing `/api/organizations` bulk endpoints, and the two Invitations endpoints. Created `docs/09-workflow/plans/employee-organization-invitation-parallel-plan.md` and work items `WORK-023` through `WORK-026`.
- **Key `WORK-023` decisions.** All three new FKs are nullable/additive so no existing row needs a backfill; `Organization.organizationTypeId` is additive alongside the existing `type` enum rather than replacing it; invitation raw tokens are never persisted (only `tokenHash`); one event per invitation, emitted only after commit; no automatic retry or expiry-sweep job in this phase. `/employees/:id/edit` being replaced by a bulk `/employees/update` route was recorded as the contract's own inference from the task text, not an explicit instruction.
- **`WORK-024` progress review.** A prior AI session ran out of tokens mid-implementation. Review found the Prisma schema/migration, Employee bulk module, and `Organization.organizationTypeId` wiring essentially complete, with the `invitations` module, accept-invitation endpoint, mail infrastructure, and Mailpit container entirely missing.
- **Invitations module first pass.** Created `MailModule`/`MailService` (nodemailer, config-driven via a new `mail` section in `AppConfig`), the `invitations` module (`POST /api/invitations`, token generation/hashing, `invitation.created` domain event, `InvitationMailListener`), and added `MAIL_*` variables to `backend/.env`/`.env.example`. This first pass did **not** extend `BaseService` — corrected in the work below.

11. The user asked for one guide file that a new AI agent can read when entering the project to understand the flow through the other files and reach the same working understanding.

12. The user added a testing preference: if Playwright is used or configured, the default must be visible browser mode with `use: { headless: false }` so the user can watch tests run.

13. The user asked to make `GlobalHttpExceptionFilter` use `ResponseHelper.error(...)` for `response.status(body.statusCode).json(...)` so API error response formatting is centralized like success responses.

## Project State and Work Completed

- The repository is a NestJS + Prisma backend with a React + TypeScript frontend using Redux Toolkit, TanStack Query, React Hook Form, Zod, and Tailwind.
- The employee feature includes employee list, create, update, and related shared API/service patterns.
- The organization feature includes organization API services and organization-type UI patterns already aligned with the project’s shared list architecture.
- Invitation flow scaffolding and hooks exist, and the employee list page has bulk selection patterns for update/delete/invite operations.
- Project rules were enforced throughout: no controller-side validation for business rules, no ad hoc API logic in components, centralized API endpoints/service wrappers, and shared list-state hooks for list pages.

## Key Implementation Work Done in This Session

1. Updated the employee list page to support shared list-query behavior plus multi-select bulk actions and invite/delete flows.
2. Added the missing `react-select` dependency required by the organization selection controls used in bulk employee create/update pages.
3. Fixed a shared TypeScript issue in `useGridInputNavigation` that was too narrow for `select` elements: the keyboard handler now accepts `HTMLElement` instead of only input/textarea events, which makes the grid navigation logic compatible with the employee form table inputs and selects.
4. Confirmed the frontend still builds successfully with `npm run build` in `frontend/`.
5. Rewired `OrganizationPage.tsx` from local "Frontend Stage" state to TanStack Query backed by `GET /api/organizations` and create/update/delete mutations backed by `POST`/`PATCH`/`DELETE /api/organizations`.
6. Added organization query/mutation hooks and query keys under `frontend/src/features/organization`.
7. Removed stale no-op/stub methods from `frontend/src/features/organization/services/organization.api.ts`; it now exposes only real `list`, `createMany`, `updateMany`, and `deleteMany` calls through `baseApiService` and `ApiEndpoints`.
8. Added `organizationTypeId` to the Organization frontend schema/types and added `react-select` Organization Type controls to Create/Edit Organization modals, sourced from `GET /api/organization-types`.
9. Updated `docs/07-frontend/pages/organization-chart.md` so the feature layout/data model no longer describes `useOrganizationStage` or `organization.api.ts` as the active source of truth.
10. Ran `npm run build` in `frontend/`; TypeScript and Vite build passed, with Vite's large chunk warning only.
11. Fixed the Organization backend validator runtime error by registering `OrganizationTypeReferenceExistsConstraint` in `OrganizationModule.providers`; without this, class-validator instantiated the constraint outside Nest DI and `PrismaService` was undefined.
12. Added a defensive guard in the validator so a DI failure returns a validation failure instead of throwing a raw `TypeError`/500.
13. Removed the **Type** field/column from Organization Create/Edit modal UI. Create/update payloads now omit `type`; backend create uses its default enum value and update preserves the existing enum value.
14. Updated `docs/07-frontend/pages/organization-chart.md` to reflect that the Organization modals expose `Organization Type` (`organizationTypeId`) but no longer expose the old enum **Type** field.
15. Ran `npm run build` in `backend/` and `frontend/`; both passed. Frontend still reports only Vite's large chunk warning.
16. Created `docs/09-workflow/memory.md` as the lightweight durable memory file for project rules, spec locations, backend/frontend/coding/testing conventions, and end-of-session responsibilities.
17. Created `docs/09-workflow/history/README.md`, `docs/09-workflow/history/2026-08-28.jsonl`, and PowerShell helper scripts under `docs/09-workflow/scripts/history/` for appending, querying, and validating daily JSONL history logs.
18. Updated `AGENTS.md` with the new Memory And History Log rule: after each working session/task, update `docs/09-workflow/memory.md` when durable knowledge changes, append meaningful events to `docs/09-workflow/history/YYYY-MM-DD.jsonl`, keep history separate from memory/session context, redact secrets, and do not create `.ai/` unless explicitly requested.
19. Verified the history workflow: append succeeded, validation passed for one JSONL file, and query filtering by `task_id` and `event_type` returned the expected events.
20. Created `docs/09-workflow/ai-agent-onboarding.md` as the first-read guide for future AI agents. It explains the distinction between rules, specs, memory, session context, and JSONL history; lists the recommended read order; summarizes backend/frontend rules; notes the current important project context; and documents end-of-task update responsibilities.
21. Updated `docs/09-workflow/memory.md` to point future agents to `docs/09-workflow/ai-agent-onboarding.md` after `AGENTS.md`.
22. Updated `AGENTS.md`, `docs/09-workflow/memory.md`, and `docs/09-workflow/ai-agent-onboarding.md` with the Playwright visible-browser rule. No Playwright config currently exists in the repo, so no config file was created.
23. Added `ResponseHelper.error(...)` in `backend/src/common/helpers/response.helper.ts` and changed `GlobalHttpExceptionFilter` to call `ResponseHelper.error(body)` before writing the JSON response.
24. Updated `docs/06-api/error-response.md`, `docs/02-solution/error-handling.md`, and `docs/09-workflow/memory.md` to document that success and error envelopes are centralized through `ResponseHelper`.
25. Ran `npm run build` in `backend/`; build passed. Unit tests were not run because the user did not explicitly request test execution.

26. Made the backend architecture rule mandatory with no exceptions in `AGENTS.md`: every entity service must extend `BaseService` and its interface must extend `IBaseService`; unusual response/request shapes, side effects, or event needs are reasons to add an entity-specific method *on top of* the inherited base methods, never to opt out of the flow. A service may inject `PrismaService` only to read a *different* entity its own delegate cannot reach. Event listeners and other collaborators must mutate through the entity's service interface, not `PrismaService`. The `auth` module was reclassified from a permitted exception to a **known non-compliant module pending its own migration task**, with an explicit note that new code must never cite it as precedent.

27. Added a sanctioned audit opt-out to `BaseService`: `entityType` now accepts `AuditEntityType | null`, and `emit()` returns early when it is `null`. This suppresses only the shared `entity.created`/`updated`/`deleted` events — every CRUD method behaves identically, so an opted-out entity still extends `BaseService` and still follows the mandatory flow. Documented in `AGENTS.md` with the conditions for using it and the rule that an opted-out entity must not be added to `AuditEntityType`/`AuditAction`/`AuditLogListener`. Also documented that a module-specific **domain** event (e.g. `invitation.created`) is still permitted and is distinct from the banned per-entity CRUD event classes.

28. Refactored `InvitationsService` to extend `BaseService<PrismaService['invitation'], GetInvitationsQueryDto>` with `entityType: null`. Removed the manual `$transaction` + direct `prisma.invitation.create` calls and the self-emitted `EntityCrudEvent`; row writes now go through inherited `this.createMany(...)`/`this.update(...)`. Business operations are named distinctly so they never shadow inherited base methods: `createInvitations()` (partitioned created/skipped result), `markSent()`, `markSendFailed()`, plus the required `findMany()`. `PrismaService` is retained only for the cross-entity Employee eligibility read, which is the one sanctioned direct use.

29. Updated the supporting Invitations files: `IInvitationsService` now extends `IBaseService`; `InvitationMailListener` writes status through the service interface instead of `PrismaService`; added `GetInvitationsQueryDto`, `InvitationNotFoundException`, and `ErrorCode.INVITATION_NOT_FOUND`. Renamed the private emitter field to `invitationEvents` because a private member of the same name in both the subclass and `BaseService` is a TypeScript conflict.

30. Ran `npx prisma generate` in `backend/` — the generated client was stale relative to `schema.prisma`, so none of the Employee-bulk/Organization-FK/Invitation code could compile until it was regenerated. Then `npx tsc --noEmit` was clean outside test files and `npm run build` passed. The 12 remaining errors are all in two pre-existing, untouched spec files (`audit-log.listener.spec.ts`, `employee.service.spec.ts`).

31. Corrected an earlier incorrect bug report to the user: `BaseService.findByIds` already throws the entity's `notFoundException` when any requested id is missing, so `EmployeeController.updateMany`/`deleteMany` discarding its return value is **not** a bug. The second flagged issue (`OrganizationTypeReferenceExistsConstraint` unregistered in `OrganizationModule`) was real and had already been fixed by the concurrent session.

32. Added a per-row delete icon with confirmation to `OrganizationTypeListPage.tsx`: a new Actions column with an MUI `DeleteIcon` button that only opens the shared `ConfirmDialog` — the API call happens exclusively on confirm. A `rowToDelete` state distinguishes the row path from the existing bulk context-menu path so both share one dialog instance; the ids sent are captured once at confirm time so a state change mid-flight cannot alter the request; a deleted row's id is removed from `checkedIds` so a later bulk delete cannot send a stale id; `colSpan` went from 5 to 6. Synced `docs/07-frontend/pages/organization-type-list.md` with the actions column, the `rowToDelete` state, both delete flows, and the explicit "no API call before confirmation" requirement. `npm run build` in `frontend/` passed with only the pre-existing Vite chunk warning.

33. Documented the history helper scripts in three places so no future agent misses them: a full "History Scripts" reference in `docs/09-workflow/memory.md` (parameters, the 28 allowed `event_type` values, auto-redaction, append-only behavior, and the requirement to run from the repo root because the scripts resolve `Join-Path $PWD` and silently create a stray `history/` folder otherwise); actionable usage examples replacing the bare filename list in `docs/09-workflow/ai-agent-onboarding.md`; and a pointer in `AGENTS.md`'s Memory And History Log rule, which previously described only the file format and never named the tooling. Verified by actually running all three scripts from the repo root.

## Repository Files Changed in This Session

- `frontend/src/features/employee/pages/EmployeeListPage.tsx`
- `frontend/src/shared/hooks/useGridInputNavigation.ts`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/src/features/organization/pages/OrganizationPage.tsx`
- `frontend/src/features/organization/components/CreateOrganizationModal.tsx`
- `frontend/src/features/organization/components/EditOrganizationModal.tsx`
- `frontend/src/features/organization/hooks/useOrganizationsQuery.ts`
- `frontend/src/features/organization/hooks/useCreateOrganizationsMutation.ts`
- `frontend/src/features/organization/hooks/useUpdateOrganizationsMutation.ts`
- `frontend/src/features/organization/hooks/useDeleteOrganizationsMutation.ts`
- `frontend/src/features/organization/services/organization.api.ts`
- `frontend/src/features/organization/schemas/organization.schemas.ts`
- `frontend/src/features/organization/types/organization.types.ts`
- `frontend/src/features/organization/utils/query-keys.ts`
- `docs/07-frontend/pages/organization-chart.md`
- `backend/src/modules/organization/organization.module.ts`
- `backend/src/modules/organization/validators/organization-type-reference.validator.ts`
- `AGENTS.md`
- `docs/09-workflow/memory.md`
- `docs/09-workflow/memory.yaml`
- `docs/09-workflow/history/README.md`
- `docs/09-workflow/history/2026-08-28.jsonl`
- `docs/09-workflow/scripts/history/append-history.ps1`
- `docs/09-workflow/scripts/history/query-history.ps1`
- `docs/09-workflow/scripts/history/validate-history.ps1`
- `docs/09-workflow/ai-agent-onboarding.md`
- Playwright visible-browser rule added to `AGENTS.md`, `docs/09-workflow/memory.md`, and `docs/09-workflow/ai-agent-onboarding.md`.
- `backend/src/common/helpers/response.helper.ts`
- `backend/src/common/filters/http-exception.filter.ts`
- `docs/06-api/error-response.md`
- `docs/02-solution/error-handling.md`
- partial backend WORK-024 changes remain in the worktree and were not completed after the user changed the active request.
- `backend/src/common/services/base.service.ts` (audit opt-out via `entityType: null`)
- `backend/src/modules/invitations/service/invitations.service.ts` (now extends `BaseService`)
- `backend/src/modules/invitations/interfaces/invitations-service.interface.ts` (now extends `IBaseService`)
- `backend/src/modules/invitations/listeners/invitation-mail.listener.ts`
- `backend/src/modules/invitations/controller/invitations.controller.ts`
- `backend/src/modules/invitations/dto/get-invitations-query.dto.ts` (new)
- `backend/src/common/exceptions/app.exception.ts` (`InvitationNotFoundException`)
- `backend/src/common/constants/error-code.constant.ts` (`INVITATION_NOT_FOUND`)
- `frontend/src/features/organization-type/pages/OrganizationTypeListPage.tsx` (per-row delete + confirm)
- `docs/07-frontend/pages/organization-type-list.md`
- `docs/09-workflow/session-context.md`
- `frontend/src/shared/hooks/useApiFieldErrors.ts`
- `frontend/src/shared/api/api-client.ts`
- `frontend/src/shared/utils/api-error-mapping.ts`
- `frontend/src/features/employee/pages/EmployeeCreatePage.tsx`
- `frontend/src/features/employee/pages/EmployeeUpdatePage.tsx`
- `frontend/src/features/organization-type/pages/OrganizationTypeCreatePage.tsx`
- `frontend/src/features/organization-type/pages/OrganizationTypeUpdatePage.tsx`
- `frontend/src/features/organization-type/utils/organization-type-form.ts`
- `docs/07-frontend/api-client.md`
- `docs/07-frontend/architecture.md`
- `frontend/src/shared/components/RequiredHeader.tsx`
- `docs/07-frontend/pages/employee-create.md`
- `docs/07-frontend/pages/employee-edit.md`
- `docs/07-frontend/pages/organization-type-create.md`
- `docs/07-frontend/pages/organization-type-update.md`

## Important Notes and Remaining Context

- The project’s “spec-first” workflow remains the governing rule: implementation follows the docs under `docs/00-project` through `docs/07-frontend` and the established UI/backend conventions.
- The task file referenced by the user is absent in this checkout, so the work reflects the repo’s actual state and the broader employee/organization task currently implied by the project specs.
- Frontend build validation passed after installing the required dependency and fixing the shared grid-navigation typing issue.
- Frontend build validation also passed after the Organization Real API Wiring work.
- Backend build validation passed after fixing the Organization validator DI registration.
- `WORK-024` backend is not complete. The agent had already made partial backend edits before the user redirected to frontend; those edits were not verified as a finished backend implementation.
- A potential future task may adjust project memory/history docs to match the user's clarified lightweight approach: simple memory for durable AI working rules and compact JSONL day logs for history, without introducing a new `.ai/` architecture.
- The lightweight memory/history workflow now exists under `docs/09-workflow/`; future sessions should use it instead of introducing `.ai/`.
- Future AI agents should read `AGENTS.md`, then `docs/09-workflow/ai-agent-onboarding.md`, then `docs/09-workflow/memory.yaml`, then `docs/09-workflow/session-context.md`, followed by the relevant work item/specs.
- Future Playwright usage must default to `use: { headless: false }`.
- Backend API success responses use `ResponseHelper.success(...)`; backend API error responses from `GlobalHttpExceptionFilter` use `ResponseHelper.error(...)`.
- The backend architecture flow is now **mandatory with no exceptions**. The only sanctioned opt-out is audit eventing, via `BaseService`'s `entityType: null`. `InvitationsService` is the reference example of an entity that opts out of audit events while still extending `BaseService`.
- The `auth` module is **out of compliance and pending migration**, not a permitted exception. Do not refactor it as a side effect of unrelated work — it needs its own task — and never cite it as precedent for skipping `BaseService`.
- `npx prisma generate` must be run after any `schema.prisma` change before backend code will compile; the client was found stale this session and regenerating it was required.
- History must be written with `docs/09-workflow/scripts/history/append-history.ps1` run **from the repo root**, never by hand-editing the `.jsonl` file — hand-writing loses `event_type` validation and automatic secret redaction.
- Frontend API failures are now normalized and surfaced globally by `frontend/src/shared/api/api-client.ts`: non-401 failures show one `react-toastify` error toast, while `401` continues to clear auth without a duplicate error toast.
- Form-level field mapping for API `fieldErrors` is centralized in `frontend/src/shared/hooks/useApiFieldErrors.ts` / `applyApiFieldErrors(...)`. Employee bulk create/update and Organization Type create/update use the shared mapper directly (`items[n].*`). Organization create/edit modals receive the mutation error from `OrganizationPage` and map API paths back to modal form paths (`items[n].* -> rows[n].*` for create, `items.0.* -> *` for edit).
- `frontend/` build validation passed for the API-toast/field-error hook work (`npm run build`); Vite only reported its existing chunk-size warning.
- Many-row table forms now use `frontend/src/shared/components/RequiredHeader.tsx` to mark required headers. Applied to Employee Create/Update required columns, Organization Type Create/Update Name, and Organization Create modal Code/Name. Employee Create/Update phone inputs are now `type="number"`.
- `frontend/` build validation passed again after the required-header/phone-input work (`npm run build`); Vite only reported its existing chunk-size warning.
- User clarified two frontend preferences after reviewing `EmployeeCreatePage.tsx`: when a confirm-dialog-backed API submit fails, close the dialog (`setPendingPayload(null)` pattern) and let toast/field errors communicate the failure; page/table work areas should use fixed viewport-relative heights with `h-[calc(100vh-${num}px)]`, where the numeric offset is chosen per screen.
- User asked to change project memory from Markdown to YAML. Durable memory now lives at `docs/09-workflow/memory.yaml`; `docs/09-workflow/memory.md` was removed. `AGENTS.md`, `docs/09-workflow/ai-agent-onboarding.md`, and `docs/09-workflow/history/README.md` now point future agents to the YAML file.
- User asked that deleting an Organization node in the React Flow organization chart must show a confirmation popup first and call the delete API only after confirmation. `OrganizationPage` now stores a `pendingDelete` payload with the selected organization id and descendant ids at click time, renders the shared `ConfirmDialog`, and calls `DELETE /api/organizations` only from the confirm handler. On failure the dialog closes and the global API error toast handles the message.
- **Still outstanding for `WORK-024` (backend):** `POST /api/auth/invitations/accept` is not implemented (`AuthModule` untouched); Mailpit (or equivalent SMTP listener) is not in `infra/docker-compose.yml` even though `backend/.env` points `MAIL_HOST`/`MAIL_PORT` at `localhost:1025`; no `.http` manual test files exist for any of the new Employee-bulk/Organization/Invitations endpoints.
- **Flagged but not acted on:** backend `DELETE /api/organization-types` does not translate a Prisma restrict-violation (an organization type still referenced by an organization) into a clean `409`/`400`, so the new frontend confirm dialog may surface a raw backend error message. This is the pre-existing gap already recorded in `docs/06-api/organization-type/delete-organization-types.md`.
- `docs/09-workflow/session-context.md` was overwritten mid-day by a concurrent session, dropping earlier cumulative history. The dropped items were restored in condensed form under "Earlier Conversation Context Recovered After Overwrite". Concurrent sessions writing this file should merge rather than replace.

## Final Status

- The requested `WORK-025` Organization Real API Wiring slice is implemented and builds.
- The lightweight Memory And History Log workflow is implemented and verified.
- The AI agent onboarding guide has been created.
- `GlobalHttpExceptionFilter` now uses centralized `ResponseHelper.error(...)`; backend build passed.
- The mandatory-architecture rule is in force, `BaseService` supports a sanctioned audit opt-out, and `InvitationsService` complies with the flow. `npx tsc --noEmit` is clean outside pre-existing test-file failures and `npm run build` passes in `backend/`.
- `/organizations/types` has a per-row delete icon that opens a confirmation popup and calls the delete API only after confirmation; `frontend/` build passes.
- Shared frontend API error handling is implemented: non-401 API failures toast globally through the Axios interceptor, and server `fieldErrors` render under matching inputs through the common React Hook Form hook across Employee bulk, Organization, and Organization Type flows. `frontend/` build passes.
- Required markers were added to the many-row form headers, and Employee bulk phone inputs are number inputs. `frontend/` build passes.
- Frontend memory now records the user's preferred failed-submit dialog behavior and fixed-height page/table area pattern.
- The history helper scripts are documented in `AGENTS.md`, `docs/09-workflow/memory.yaml`, and `docs/09-workflow/ai-agent-onboarding.md`, and were verified by running all three.
- `WORK-024` backend remains incomplete/partial (accept-invitation endpoint, Mailpit container, `.http` files).
- `WORK-025` frontend is partially done (Employee list bulk actions, Organization real API wiring, OrganizationType per-row delete); the Employee bulk table editor, `/employees/update` route, and `/invitation/accept` page were not part of these sessions.
- No additional user confirmation was required because the user explicitly instructed the agent to proceed without a confirmation step.

## Workflow Module Frontend Implementation (2026-08-29)

- The repo already had a partially scaffolded workflow feature set; this session completed the integration and validation work required for the task brief.
- The route metadata union was widened to include workflow sidebar keys, and the app router now includes the seven required workflow screens: `/workflows`, `/workflows/create`, `/workflows/:id/edit`, `/workflow-requests/new`, `/workflow-requests`, `/workflow-requests/inbox`, and `/workflow-requests/:id`.
- The route order was kept strict so the literal `/workflow-requests/new` and `/workflow-requests/inbox` paths are registered before the dynamic `/workflow-requests/:id` route.
- The authenticated app layout was updated with the new Workflow sidebar group and the Notification Bell placed beside the existing account menu without modifying the UserMenu / Change Password / Logout behavior.
- Shared API endpoints were centralized under `frontend/src/shared/api/api-endpoints.ts` for workflows, workflow requests, and notifications.
- The workflow socket provider was mounted in the authenticated app shell to invalidate TanStack Query caches on workflow-notification socket events without mutating cached data.
- The workflow feature compiles end-to-end and passes a frontend production build (`cd frontend; npm run build`).
- Current repo status: the task brief is implemented and validated; no additional work is outstanding in this scope unless a backend integration later flips the mock API flag off and removes the contract fixtures.

## Direct Source-of-Truth Rule Applied to This Repo

- The user explicitly clarified that all implementation work must be created and edited directly in the real project directory at `C:/test-project`, not in temporary staging worktrees such as `C:/test-project.worktrees/read-agents-md-file-rules`.
- This requirement was enforced by checking the canonical project tree and then copying the workflow and notification implementation directly into the main repo.
- The main repo now contains the implementation files directly under:
  - `frontend/src/features/notification/components/NotificationBell.tsx`
  - `frontend/src/features/notification/components/NotificationItem.tsx`
  - `frontend/src/features/workflow/pages/WorkflowListPage.tsx`
  - `frontend/src/features/workflow/pages/ReviewerInboxPage.tsx`
  - `frontend/src/features/workflow/pages/WorkflowRequestDetailPage.tsx`
- The temp worktree is treated as a staging location only; the actual working code is now in `C:/test-project` and not dependent on the temp folder.
- Hard rule: `C:/test-project.worktrees/` is not a coding location anymore. Future edits must be made only in the main repo at `C:/test-project`.
- Added shared `frontend/src/shared/hooks/useClickOutside.ts` and wired it to `NotificationBell` so an enabled notification panel closes on document `pointerdown` outside its container.
- Frontend routing rule clarified: internal app navigation must use React Router client-side routing such as `useNavigate`; do not use `window.location.assign` or other full-page reloads for internal routes.
- Workflow API contract synchronization pass completed for `WORK-031`: the frontend now uses `canApprove` / `canFeedback` / `canReject` / `canCancel` / `canResubmit`, passes `scope/page/limit/status/workflowId` into `workflowRequests.list`, calls `PUT /api/workflows/:id` instead of `PATCH`, and sends `revision` plus `formData` for the resubmit action.
- The `USE_MOCK_WORKFLOW_API` flag is disabled so the feature reads from `baseApiService` and `ApiEndpoints` rather than returning mock data.

## WORK-030 Frontend Completion Follow-up (2026-08-29)

- The user pointed out that Agent 3 had marked `WORK-030` complete too early: the components existed, but key UI wiring was missing.
- `WorkflowCreatePage.tsx` now composes `FormSchemaBuilder`, `WorkflowStepBuilder`, and `WorkflowFlow`. After creating the workflow definition it calls `useReplaceWorkflowStepsMutation()` so the approval chain is saved through `POST /api/workflows/:id/steps`.
- `WorkflowEditPage.tsx` was rebuilt as a workflow-definition editor. It no longer renders `DynamicFormRenderer`; it loads workflow detail, resets React Hook Form with metadata/form schema, manages local step drafts, shows the React Flow preview, updates the workflow, then calls `replaceSteps`.
- `WorkflowStepBuilder.tsx` now keeps `organizationTypeName` in sync when organization type selection changes so the flow preview has useful labels.
- `workflow.api.ts` now sends replace-chain payloads as `{ steps: [{ name, organizationTypeId }] }`, matching the frozen workflow contract instead of posting a raw array.
- `WorkflowActionBar.tsx` now reads only the contract `canApprove`, `canFeedback`, `canReject`, `canCancel`, and `canResubmit` fields.
- `WorkflowRequestDetailPage.tsx` now opens a confirmation dialog for actions, requires comments for `feedback` and `reject`, sends `revision` on every action, includes `formData` for `resubmit`, and handles `409 WORKFLOW_REQUEST_STALE` by refetching the request detail and showing a calm info toast without navigating away.
- Added frontend specs for workflow definitions, workflow requests, and workflow notifications under `docs/07-frontend/pages/`, and updated `docs/07-frontend/architecture.md`, `docs/07-frontend/api-client.md`, and `docs/07-frontend/react-route.md`.
- Validation: `cd frontend; npm run build` passed. No tests were created or run, per project testing rules and the task brief.

## WORK-032 Auth Refresh Token Task Creation (2026-08-29)

- The user asked whether the project currently has a refresh-token API and whether the frontend Axios service is wired for it.
- Repo inspection found that backend auth is currently stateless bearer access-token only: no `POST /api/auth/refresh` route exists, `AuthService` documents no refresh token/session store, and `docs/06-api/authentication.md` says there is no refresh endpoint in this phase.
- Frontend inspection found `api-client.ts` attaches only the access token from Redux and clears auth on `401`; there is no silent-refresh retry path.
- Created `docs/work/WORK-032-auth-refresh-token.md` as a new draft work item for backend + frontend refresh-token implementation and spec updates.
- The task records that specs must be amended first because current API/frontend specs explicitly say refresh tokens do not exist.

## Workflow Create Page Table Editors (2026-08-29)

- The user asked to fix frontend `/workflows/create` so **Form Schema** and **Approval Steps** use table layouts like Employee bulk create and can add many rows.
- Rebuilt `frontend/src/features/workflow/pages/WorkflowCreatePage.tsx` around React Hook Form `useFieldArray` rows for both form fields and approval steps.
- Added checkbox row selection for both tables, shared `ContextMenu` actions for submit/add/delete, shared `useGridInputNavigation` for arrow-key movement, Zod validation, and `useApplyApiFieldErrors` for server field-error mapping.
- Form Schema table supports key, label, type, required, placeholder, and select options text (`Label:value, Label 2:value2`).
- Approval Steps table supports step name and organization type, with organization type options fetched once from `GET /api/organization-types`.
- The page still creates the workflow metadata/schema first, then calls `replaceSteps` to persist the approval chain, and still renders `WorkflowFlow` as a preview.
- Updated `docs/07-frontend/pages/workflow-definition.md` to document the table-editor behavior.
- Validation: `cd frontend; npm run build` passed. No tests were created or run.

## Workflow List Page Rule Alignment (2026-08-29)

- The user asked to fix missing frontend-rule items in `frontend/src/features/workflow/pages/WorkflowListPage.tsx`.
- `WorkflowListPage` now imports `useState` and `useDebounce`, keeps local status-filter UI state, and passes `{ page, limit, sortBy, sortOrder, status, search }` into `useWorkflowsQuery(...)`.
- `useWorkflowsQuery` now accepts an optional `WorkflowListQuery`, includes it in the query key, and forwards it to `workflowApiService.list(...)`.
- `workflowApiService.list(...)` now sends `GET /api/workflows` params for `page`, `limit`, `search`, `status`, `sortBy`, and `sortOrder`; the mock branch also honors search/status/page/limit.
- `WorkflowListPage` now has a status filter, an `updatedAt` sortable column, fixed viewport-relative scroll height `h-[calc(100vh-290px)]`, sticky table header, and `colSpan={5}` loading/empty rows.
- Updated `docs/07-frontend/pages/workflow-definition.md` with the workflow list behavior.
- Validation: `cd frontend; npm run build` passed. No tests were created or run.

## Workflow Edit Page Table Editors (2026-08-29)

- The user asked to make `/workflows/:id/edit` look and behave like `/workflows/create`.
- Rebuilt `frontend/src/features/workflow/pages/WorkflowEditPage.tsx` with the same table-style Form Schema and Approval Steps editors used by create.
- Edit now uses React Hook Form `useFieldArray`, Zod validation, row checkboxes, shared `ContextMenu`, shared `useGridInputNavigation`, and `useApplyApiFieldErrors`.
- Edit resets table rows from workflow detail, converts form schema select options to the same comma text format, previews steps through `WorkflowFlow`, then saves with `PUT /api/workflows/:id` and `replaceSteps`.
- Updated `docs/07-frontend/pages/workflow-definition.md` so Create/Edit are documented as matching table-editor screens.
- Validation: `cd frontend; npm run build` passed. No tests were created or run.

## Workflow Request Submit UI Update (2026-08-29)

- The user asked to fix `workflow-requests/new`: use Material UI styling, make **Choose workflow** a searchable `react-select`, keep the label and select on one row, and lay out dynamic workflow form fields so `textarea` uses 12 columns while all other fields use 3 columns.
- Rebuilt `frontend/src/features/workflow/pages/WorkflowRequestSubmitPage.tsx` with MUI `Paper`/`Box`/`Typography`, a searchable/clearable `react-select` workflow picker, and active-workflow query params.
- Updated `frontend/src/features/workflow/components/DynamicFormRenderer.tsx` to render a 12-column grid where textarea fields span `col-span-12`, while text/date/number/select/checkbox fields use `md:col-span-3`.
- Updated `DynamicFormRenderer` again so required dynamic fields render the shared `RequiredHeader` marker beside the label. The user later clarified to keep the current `fields.sort((a, b) => ...)` implementation so textarea fields are sorted after smaller fields before rendering, and the frontend spec was updated to document that choice.
- Updated `docs/07-frontend/pages/workflow-request.md` with the new submit-page UI behavior.
- Validation: `cd frontend; npm run build` passed. No tests were created or run.

## Workflow Request List Page Rule Alignment (2026-08-29)

- The user asked to fix frontend-rule gaps in `/workflow-requests` and `/workflow-requests/inbox`.
- Rebuilt `frontend/src/features/workflow/pages/MyRequestsPage.tsx` and `frontend/src/features/workflow/pages/ReviewerInboxPage.tsx` with debounced search, status filters, `submittedAt` sortable columns, fixed viewport-relative table height, sticky headers, valid `tbody` loading/empty rows with `colSpan={4}`, and full pagination summaries.
- `workflowRequestApiService.list(...)` mock mode now honors request `scope`, `search`, `status`, `page`, and `limit`, and its fallback meta reflects the actual query values.
- Updated `docs/07-frontend/pages/workflow-request.md` with request list behavior.
- Validation: `cd frontend; npm run build` passed. No tests were created or run.
