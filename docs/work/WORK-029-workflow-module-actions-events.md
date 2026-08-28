---
id: WORK-029
type: workflow
module: workflow
status: draft
depends_on:
  - WORK-027
---

# WORK-029: Workflow Action Engine, Events, Socket, Notification Backend (Agent 2)

## Work Status
`APPROVED` - ready for a backend AI agent to implement after reading the required specs. Per project Planning Rules, this is contract-approved, not code-authorized — implementation still requires a separate, explicit user go-ahead in the implementing session before any file is written.

## Summary
Implement everything that changes a workflow request's state, plus the event → socket → notification pipeline: the five action endpoints, immutable history writes, server-side permission enforcement, transactional integrity, optimistic-lock concurrency, application events, `@OnEvent` listeners, a Socket.IO gateway with scoped rooms, notification generation, and the notification REST API.

This work item holds the two hardest correctness requirements in the module: **atomicity** (nothing half-written, nothing emitted before commit) and **concurrency** (two simultaneous approvals must not both succeed). It can run in parallel with `WORK-028` and `WORK-030` — see Dependencies for how it avoids waiting.

## Scope
In scope:
- `POST /api/workflow-requests/:id/{approve,feedback,reject,cancel,resubmit}`.
- Pure transition functions implementing the contract's state machine (next/previous step and status resolution).
- Transactional action engine: re-read → guard status → guard authority → insert history → conditional update with `revision` → insert notifications → COMMIT → emit.
- Application event constants and payload classes; `@OnEvent` listeners; `WorkflowGateway` (the only file touching Socket.IO) with `employee:{id}` and `workflow-request:{id}` rooms and handshake JWT auth.
- Notification recipient resolution and generation inside the action transaction.
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`.
- Socket.IO dependency installation and adapter registration in `main.ts` if required.
- API specs for the action and notification endpoints, plus the socket contract.

Out of scope:
- Prisma schema, migration, `app.module.ts`, error-code and exception files — all owned and pre-populated by `WORK-028`, **including this work item's own codes and exceptions**.
- Workflow definition CRUD, step management, submit, and read endpoints (`WORK-028`).
- All frontend work (`WORK-030`).
- Automated tests of any kind.

## Dependencies
Executable agent prompt (read this first, it is the detailed task definition):
- `docs/09-workflow/plans/workflow-module/agent-2-prompt.md`

Required specs to read before coding:
- `AGENTS.md`
- `docs/09-workflow/plans/workflow-module/workflow-contract.md` — binding contract
- `docs/09-workflow/plans/workflow-module/workflow-master-spec.md`
- `docs/00-project/*`, `docs/01-business/*`, `docs/02-solution/*`, `docs/03-technology/*`, `docs/04-database/*`, `docs/06-api/*`
- `docs/work/WORK-027-workflow-module-contract.md`

Reference patterns to copy: `backend/src/modules/invitations/` (domain event + async listener, emit-after-write), `backend/src/modules/organization-type/` (module wiring).

**Do not wait for `WORK-028`.** Everything needed is specified in the contract. Where `WORK-028`'s output is not yet available, code against a local interface and swap at integration: Prisma types → local TS types matching the contract exactly; the permission function → a temporary implementation to be **deleted** and replaced by `WORK-028`'s export; the `form_data` validator → the same. Do not create a second migration, and do not edit `workflow.module.ts` — put providers in a separate module that integration imports with one line.

## Implementation Notes
- Never hard-code a role name. FEEDBACK must be generic via `parentId`.
- **Never emit an application event or socket message before COMMIT.** A pre-commit emit that then rolls back leaves every connected client permanently showing state that does not exist in the database.
- **Guard order is status-then-authority.** Reversed, a terminal request leaks `403` to someone who is in fact allowed but merely too late, and vice versa — the contract's 403-vs-409 discipline depends on this order.
- Concurrency control is `UPDATE ... WHERE id = :id AND revision = :expected`, incrementing `revision`; zero rows affected → `409 WORKFLOW_REQUEST_STALE`. Do not replace this with a read-then-write check, which reintroduces the race.
- History is insert-only. Never expose an update or delete path for it.
- Notification rows are written **inside** the action transaction, so generation cannot be an `@OnEvent` listener (a post-commit listener cannot join the transaction). The post-commit event only pushes `notification.created` over the socket.
- Recipients are **sets** resolved by `WORK-028`'s exported permission function — never a second resolver. Never notify the actor; zero recipients is valid and silent.
- `prisma.$transaction` is authorised only in the action service and only for the multi-table atomic write; every single-table read/write that fits an inherited `BaseService` method must use it. Services extend `BaseService` with `entityType: null`.
- The gateway is the only file touching Socket.IO; no service calls `socket.emit()`. Room joins for `workflow-request:{id}` must re-verify read authority — room membership is an authorization boundary, and an unauthorized join would leak another employee's request activity.
- Action responses must be byte-identical in shape to `WORK-028`'s `GET /api/workflow-requests/:id`, including recomputed `permissions`.

## Test Plan
- Do not create unit test files and do not run tests — out of scope per `AGENTS.md` Testing Rules and the task brief.
- Permitted verification: `npx tsc --noEmit`, `npm run build`, manual endpoint exercise via a `.http` file, and manual socket verification against a running client.

## Test Result
NOT RUN - implementation not started.

## Risks / Ambiguities
- Whether a requester may approve their own request at a step whose organization type they happen to match is **not specified** by the brief and not forbidden by the contract. Do not decide it silently — surface it.
- The temporary permission implementation is a security risk if it survives integration. It must be deleted and replaced by `WORK-028`'s export, and the final report must state whether that swap happened.
- Socket.IO is not currently a dependency in either package; adding it is this work item's only dependency change.
- A socket emission failure must not surface as a failed HTTP request — the database work is already committed by then.
