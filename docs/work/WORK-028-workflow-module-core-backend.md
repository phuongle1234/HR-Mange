---
id: WORK-028
type: workflow
module: workflow
status: draft
depends_on:
  - WORK-027
---

# WORK-028: Workflow Module Core Backend (Agent 1)

## Work Status
`APPROVED` - ready for a backend AI agent to implement after reading the required specs. Per project Planning Rules, this is contract-approved, not code-authorized — implementation still requires a separate, explicit user go-ahead in the implementing session before any file is written.

## Summary
Implement the workflow data layer plus the definition and read APIs: Prisma schema and migration for all workflow tables (and the notification table), workflow definition CRUD, step-chain management, `form_schema`/`form_data` validation, request submission, and the request/history read endpoints.

This is the foundation the other two agents build against, so the schema and DTO shapes must land exactly as contracted — they are being coded against in parallel. This work can run in parallel with `WORK-029` and `WORK-030` because all three depend only on `WORK-027`.

## Scope
In scope:
- Prisma schema + one migration: `WorkflowStatus`/`WorkflowRequestStatus`/`WorkflowAction`/`NotificationType` enums; `Workflow`, `WorkflowStep`, `WorkflowRequest`, `WorkflowHistory`, `Notification` models; reciprocal relation fields on `Employee`.
- `GET/POST /api/workflows`, `GET/PUT /api/workflows/:id`, `POST /api/workflows/:id/steps` (replace-chain).
- `POST /api/workflow-requests` (submit), `GET /api/workflow-requests/:id`, `GET /api/workflow-requests/:id/histories`, `GET /api/workflow-requests` (with `scope=mine|inbox`).
- `form_schema` shape validator and the reusable `form_data` validator (Agent 2 reuses the latter verbatim for RESUBMIT).
- The single exported permission/`permissions` computation implementing the contract's approver-resolution rule (Agent 2 reuses it).
- All shared-file additions, in one pass each, **including Agent 2's entries**: error codes, exception classes, `app.module.ts` registration of both `WorkflowModule` and `NotificationModule`.
- Database and API specs under `docs/04-database/entities/` and `docs/06-api/workflow/`.

Out of scope:
- APPROVE/FEEDBACK/REJECT/CANCEL/RESUBMIT, events, socket, notification generation (`WORK-029`).
- All frontend work (`WORK-030`).
- Automated tests of any kind.
- Anything added to `AuditEntityType`/`AuditAction`/`AuditLogListener` — workflow entities opt out of the shared audit log.

## Dependencies
Executable agent prompt (read this first, it is the detailed task definition):
- `docs/09-workflow/plans/workflow-module/agent-1-prompt.md`

Required specs to read before coding:
- `AGENTS.md`
- `docs/09-workflow/plans/workflow-module/workflow-contract.md` — binding contract
- `docs/09-workflow/plans/workflow-module/workflow-master-spec.md`
- `docs/00-project/*`, `docs/01-business/*`, `docs/02-solution/*`, `docs/03-technology/*`, `docs/04-database/*`, `docs/06-api/*`
- `docs/work/WORK-027-workflow-module-contract.md`

Reference pattern to copy: `backend/src/modules/organization-type/`.

## Implementation Notes
- Never hard-code a role name. No `TEAM_LEAD`/`MANAGER`/`DEPARTMENT_MANAGER` anywhere — authority is `organizationTypeId` plus organization ancestry only.
- Never derive the chain from `stepOrder`; `parentId` is the only chain source. `stepOrder` is display/tiebreak only.
- Every service extends `BaseService` with **`entityType: null`** (audit opt-out); every interface extends `IBaseService`; controllers inject string tokens with `useExisting` providers.
- Controllers perform no validation — it lives in DTOs and reusable DTO validators.
- `prisma.$transaction` is permitted only for the two genuinely multi-row atomic writes: step-chain replace, and submit (request + history).
- `POST /:id/steps` assigns `parentId` from array order; the client never sends it. Rejects with `409 WORKFLOW_HAS_ACTIVE_REQUESTS` when a non-terminal request exists.
- Submit emits nothing — leave a `// TODO(WORK-029): emit workflow.request.created after commit` marker at the exact line so integration is a one-line change.
- `permissions` computation must exist in exactly **one** exported place. Two implementations of the authority rule would be a security bug, not a duplication nit.
- Run `npx prisma generate` and confirm the generated client actually contains all five new models — a stale client is the most common cause of confusing downstream failures for the other two agents.

## Test Plan
- Do not create unit test files and do not run tests — out of scope per `AGENTS.md` Testing Rules and the task brief.
- Permitted verification: `npx prisma generate`, `npx tsc --noEmit`, `npm run build`, and manual endpoint exercise via a `.http` file.

## Test Result
NOT RUN - implementation not started.

## Risks / Ambiguities
- The migration adds new tables and new relation fields on `Employee` only; it must not alter existing columns. Do not use destructive database resets.
- Two pre-existing TypeScript failures exist in `audit-log.listener.spec.ts` and `employee.service.spec.ts`; they are unrelated to this work and must not be "fixed" as a side effect.
- If the contract appears to be missing something, record it in the final report and ask — do not invent a value.
