---
id: WORK-024
type: workflow
module: employee-organization-invitation
status: draft
depends_on:
  - WORK-023
---

# WORK-024: Employee Bulk / Organization FK / Invitations Backend

## Work Status
`APPROVED` - ready for a backend AI agent to implement after reading the required specs. Per project Planning Rules, this is contract-approved, not code-authorized — implementation still requires a separate, explicit user go-ahead in the implementing session before any file is written.

## Summary
Implement the NestJS/Prisma backend for Employee bulk Create/Update/Delete, the `Employee.organizationId`/`userId` and `Organization.organizationTypeId` FKs, and a new event-driven Invitations module with async email, according to the completed contract in `WORK-023`. This work can run in parallel with `WORK-025` because both depend only on `WORK-023`.

## Scope
In scope:
- Prisma schema/migration: `Employee.organizationId`, `Employee.userId`, `Organization.organizationTypeId`, new `Invitation` model + `InvitationStatus` enum.
- Employee module: `POST /api/employees/bulk`, `PATCH /api/employees/bulk`, `DELETE /api/employees/bulk`, `POST /api/employees/by-ids`, added alongside the existing single-record routes.
- Organization module: add `organizationTypeId` to `CreateOrganizationDto`/`UpdateOrganizationDto`/`OrganizationFilterDto`.
- New `invitations` NestJS module: `InvitationsController`/`InvitationsService`, `POST /api/invitations`, token generation/hashing, transactional create, per-invitation `invitation.created` events.
- `InvitationMailListener` + `MailModule`/`MailService`/`MailProvider` abstraction (SMTP-backed for local dev).
- Accept-invitation endpoint: `POST /api/auth/invitations/accept`.
- New audit entity/action constants (`INVITATION`, `INVITATION_CREATED/UPDATED/DELETED`) and one `AuditLogListener` lookup row.
- New error codes/exceptions per `docs/06-api/error-response.md`'s 2026-08-26 sections.
- Mailpit (or equivalent) service added to `infra/docker-compose.yml`; `.env.example`/`docs/03-technology/infrastructure.md` updated with `MAIL_*` vars.
- Manual `.http` request files for the new endpoints, following the existing `backend/test/http/*` pattern.

Out of scope:
- React/frontend implementation (`WORK-025`).
- Changing Organization chart frontend behavior.
- Changing existing Employee single-record endpoint behavior, unless a direct compile/runtime conflict requires it and the specs are updated first.
- Automatic invitation retry / scheduled expiry sweep (explicitly out of scope per the daily task, §23).

## Dependencies
Required specs to read before coding:
- `docs/00-project/*`
- `docs/01-business/*`
- `docs/02-solution/*`
- `docs/03-technology/*`
- `docs/04-database/*`
- `docs/06-api/*`
- `docs/09-workflow/plans/employee-organization-invitation-parallel-plan.md`
- `docs/work/WORK-023-employee-organization-invitation-contract.md`

Primary contract specs:
- `docs/04-database/entities/employee.md`, `organization.md`, `invitation.md`
- `docs/06-api/employee/bulk-create-employees.md`, `bulk-update-employees.md`, `bulk-delete-employees.md`, `get-employees-by-ids.md`
- `docs/06-api/organization/list-organizations.md`, `create-organizations.md`, `update-organizations.md`, `delete-organizations.md`
- `docs/06-api/invitations/create-invitations.md`, `accept-invitation.md`

## Implementation Notes
- Employee bulk controller routes must exactly match `/api/employees/bulk` (`POST`/`PATCH`/`DELETE`) and `/api/employees/by-ids` (`POST`) — the existing single-record routes on `/api/employees` are untouched.
- Bulk create/update/delete must reuse inherited `BaseService.createMany`/`updateMany`/`deleteMany`/`findByIds` — per `AGENTS.md`'s Mandatory BaseService Reuse Rule, do not recreate a parallel CRUD variant.
- `organizationId` FK existence must be validated before create/update writes; failure maps to `400 ORGANIZATION_NOT_FOUND` (field-scoped, not row-existence `404`).
- Invitations create is intentionally **not** routed through `BaseService.createMany` (its partitioned `created`/`skipped` response shape and per-row token side effect don't fit that contract) — see `API-INVITATIONS-CREATE`'s Database Interaction section for the recorded rationale.
- Token hashing: hash the raw token before persisting; never persist or log the raw token or the invitation URL.
- `invitation.created` events publish only **after** the creating transaction commits, one event per invitation (not one bulk event) — task §14/§20, explicit.
- Accept-invitation is unauthenticated (`token` itself is the credential) and must not enumerate whether a token ever existed (`404 INVITATION_TOKEN_INVALID` is the generic response for "no such token").
- Request validation must live in DTO classes or reusable DTO validators, per existing project convention — do not validate duplicate ids/fields, FK existence formatting, or array sizes in controller methods.

## Test Plan
- Do not create or run unit tests unless the user explicitly asks for UT in the implementation request.
- Recommended manual verification when implementation is requested:
  - run TypeScript build
  - run Prisma migration/apply command appropriate for current DB state
  - exercise all new endpoints with `.http` files
  - verify audit log rows for Employee bulk create/update/delete and Invitation creation
  - verify a local Mailpit instance actually receives the invitation email
  - verify accept-invitation end-to-end: token invalid, expired, already-accepted, and success cases

## Test Result
NOT RUN - backend implementation not started.

## Risks / Ambiguities
- Mail provider abstraction shape (`MailService`/`MailProvider` interface split) is an implementation detail left to the backend agent, as long as it supports swapping `MAIL_PROVIDER=smtp` for a future Mailjet provider without changing `InvitationMailListener`'s call site (task §19).
- If the current Organization bulk `code`-uniqueness raw-`P2002`-error gap (`DB-ORGANIZATION`'s pre-existing, recorded ambiguity) gets touched incidentally while adding `organizationTypeId`, either leave it as-is or fix it as an explicitly separate, called-out change — do not silently fix it as a side effect.
- Existing database drift should be handled carefully; do not use destructive reset unless the user explicitly approves.
