---
id: WORK-023
type: workflow
module: employee-organization-invitation
status: draft
depends_on:
  - DB-EMPLOYEE
  - DB-ORGANIZATION
  - DB-ORGANIZATION-TYPE
  - DB-INVITATION
  - API-EMPLOYEE-BULK-CREATE
  - API-EMPLOYEE-BULK-UPDATE
  - API-EMPLOYEE-BULK-DELETE
  - API-EMPLOYEE-BY-IDS
  - API-ORGANIZATION-LIST
  - API-ORGANIZATION-CREATE-MANY
  - API-ORGANIZATION-UPDATE-MANY
  - API-ORGANIZATION-DELETE-MANY
  - API-INVITATIONS-CREATE
  - API-AUTH-INVITATIONS-ACCEPT
  - FRONTEND-EMPLOYEE-LIST
  - FRONTEND-EMPLOYEE-CREATE
  - FRONTEND-EMPLOYEE-EDIT
  - FRONTEND-ORGANIZATION-CHART
  - FRONTEND-INVITATION-ACCEPT
---

# WORK-023: Employee Bulk / Organization FK / Invitations Contract Specs

## Work Status
`IMPLEMENTED` - contract specs were created so a backend agent and a frontend agent can work independently from the same source of truth.

## Summary
Define the database, API, and frontend contract for the 2026-08-26 daily task (`docs/09-workflow/daily-tasks/2026-08-26.md`) before backend/frontend implementation starts: Employee bulk Create/Update/Delete mirroring the existing OrganizationType pattern, an `Employee.organizationId` FK, an `Employee.userId` FK for login accounts, a new event-driven Invitations module with async email, and Organization API wiring (including a new `organizationTypeId` FK) replacing the org-chart screen's local-only stub. This work item is the coordination point for `WORK-024`/`WORK-025` — both read these specs instead of depending on each other's source code.

## Scope
In scope:
- Database specs: `Employee.organizationId`/`userId`, `Organization.organizationTypeId`, new `Invitation` entity, updated `relationships.md`/`indexes.md`/`architecture.md`.
- API specs: Employee bulk create/update/delete/by-ids (new `/api/employees/bulk`, `/api/employees/by-ids`); Organization list/create-many/update-many/delete-many (documenting the existing real endpoints, which had no `docs/06-api/` write-up before this, plus the new `organizationTypeId` field); Invitations create (`POST /api/invitations`) and accept (`POST /api/auth/invitations/accept`); updated `conventions.md`/`error-response.md`.
- Frontend page specs: Employee List (multi-select, context menu, Invite User), Employee Create/Edit (rewritten as a bulk table editor with a `react-select` Organization column, replacing the single-record forms and the `/employees/:id/edit` route), Organization Chart (real API wiring + Organization Type select, replacing the local "Frontend Stage" stub), new Invitation Accept page; updated `architecture.md`/`api-client.md`/`react-route.md`.
- A parallel-work plan (`docs/09-workflow/plans/employee-organization-invitation-parallel-plan.md`) splitting the remaining work into one backend work item and one frontend work item that can run at the same time.

Out of scope:
- NestJS implementation (`WORK-024`).
- Prisma migration (`WORK-024`).
- React implementation (`WORK-025`).
- Mail/SMTP infrastructure implementation (`WORK-024`) — only its contract (env vars, event/listener shape) is specified here.
- Runtime integration testing (`WORK-026`).

## Dependencies
- Plan: `docs/09-workflow/plans/employee-organization-invitation-parallel-plan.md`.
- Task source: `docs/09-workflow/daily-tasks/2026-08-26.md`.
- Prior pattern this mirrors: `docs/09-workflow/plans/organization-type-parallel-contract-plan.md`, `WORK-019`-`WORK-022`.

## Implementation Notes
Resolved contract decisions (full rationale in the spec files themselves):
- `Employee.organizationId`: nullable `int4` FK, `ON DELETE SET NULL` — no forced backfill of existing employees.
- `Employee.userId`: nullable, unique `uuid` FK, `ON DELETE SET NULL` — set only by invitation-accept, never by Employee create/update.
- `Organization.organizationTypeId`: nullable `uuid` FK, `ON DELETE RESTRICT` — additive alongside the existing `type` enum, not a replacement.
- New `Invitation` entity: `PENDING → SENT/SEND_FAILED`, `SENT → ACCEPTED`; raw tokens are never persisted, only `tokenHash`; per-invitation events (not one bulk event), published only after the create transaction commits.
- Employee bulk endpoints live at `/api/employees/bulk` and `/api/employees/by-ids`, additive alongside the existing single-record endpoints (`POST`/`PUT`/`DELETE /api/employees/:id` stay unchanged).
- Organization bulk endpoints are documented as they actually exist in code today (`items`/`ids` body shapes, no pagination), not rewritten to match another pattern.
- `/employees/:id/edit` (single-record) is replaced by `/employees/update` (bulk, Redux-selection-driven) — the same structural change OrganizationType already has relative to a hypothetical single-record edit page.
- `react-select@5.10.2` is the frontend's choice for the Organization/Organization Type select fields, gated on a React 19 compatibility check the frontend agent must run first (task §5.5) — not yet a dependency.

## Test Plan
- No runtime tests required for this spec-only work item.
- Review all created/updated specs for:
  - endpoint method/path consistency with `docs/06-api/conventions.md`
  - request/response DTO consistency between `docs/04-database` and `docs/06-api`
  - error code consistency with `docs/06-api/error-response.md`
  - frontend route, query-key, and Redux-key clarity
  - absence of blocking ambiguities (each spec file's own Ambiguities section)

## Test Result
NOT RUN - spec-only work item; no implementation tests were requested.

## Risks / Ambiguities
- The daily task's own title ("thêm chức năng cho UI") did not match its body (a full backend+frontend spec); the user confirmed proceeding with the body as written before this contract was drafted — see `docs/09-workflow/session-context.md` for that exchange.
- Whether `/employees/:id/edit` should be fully removed (this contract's reading) vs. kept alongside the new bulk `/employees/update` route is this contract's own inference from task §5, not a line-by-line instruction in the daily task — flagged in `FRONTEND-EMPLOYEE-EDIT`'s Ambiguities so `WORK-025` implements the same assumption this contract does.
- Invitation TTL (72h default) and whether `type`/`organizationTypeId` should eventually converge on Organization are both recorded as non-blocking defaults/open questions in the relevant spec files, not silently decided.
- Existing unrelated worktree changes were present while this item was created and were not touched.
