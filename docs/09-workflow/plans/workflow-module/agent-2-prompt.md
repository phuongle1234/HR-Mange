# Agent 2 Prompt — Action Engine + Events + Socket.IO + Notification Backend (`WORK-029`)

## ROLE
You are a senior NestJS engineer specialising in transactional state machines and real-time delivery. You own everything that **changes a workflow request's state**, plus the event → socket → notification pipeline.

You hold the two hardest correctness requirements in the module: **atomicity** (nothing half-written, nothing emitted before commit) and **concurrency** (two simultaneous approvals must not both succeed). Get those right and the rest is mechanical.

## MISSION
Deliver:
1. Five action endpoints: APPROVE, FEEDBACK, REJECT, CANCEL, RESUBMIT.
2. Immutable history writes + server-side permission enforcement.
3. Transactional integrity + optimistic-lock concurrency.
4. Application events → `@OnEvent` listeners → Socket.IO gateway with scoped rooms.
5. Notification generation + notification REST API.

## BEFORE YOU WRITE ANY CODE
Read, in this order:
1. `AGENTS.md` — mandatory. Note the **no-exceptions** backend flow, the controller-must-not-validate rule, the testing restriction, and that event listeners must mutate through a service interface, never `PrismaService`.
2. `workflow-contract.md` — **your binding contract.** §4 (permission rule — read twice), §5.2–5.3 + §5.6 (your endpoints and shapes), §6 (error codes and the 403-vs-409 discipline), §7 (state machine — normative), §8 (transactions + concurrency + the §8.3 decision that authorises your `$transaction` use), §9 (events/sockets/rooms/payloads), §10 (notification rules), §11 (file ownership).
3. `workflow-master-spec.md` — §2.2 Gap B (why `BaseService` can't do your transaction), §5 (permission consequences), §6 (event layering), §7 (notifications).
4. Spec folders required by `AGENTS.md` for backend work: `docs/00-project`, `docs/01-business`, `docs/02-solution`, `docs/03-technology`, `docs/04-database`, `docs/06-api`.
5. Patterns to copy:
   - `backend/src/modules/invitations/` — the domain-event + `@OnEvent(..., { async: true })` listener pattern, and emit-only-after-write.
   - `backend/src/modules/organization-type/` — module/controller/interface/service wiring.

## FILES YOU OWN
```
backend/src/modules/workflow/actions/**
backend/src/modules/workflow/events/**
backend/src/modules/workflow/listeners/**
backend/src/modules/workflow/gateway/**
backend/src/modules/notification/**
backend/src/main.ts                                     (only if the socket adapter needs registering)
backend/package.json                                    (socket deps only)
docs/06-api/workflow/*action*.md, docs/06-api/notification/**   (new specs)
```

Suggested layout:
```
backend/src/modules/workflow/
├── actions/
│   ├── controller/workflow-action.controller.ts        ← the 5 POST routes
│   ├── service/workflow-action.service.ts              ← state machine + transaction
│   ├── interfaces/workflow-action-service.interface.ts
│   ├── dto/{approve,feedback,reject,cancel,resubmit}-workflow-request.dto.ts
│   └── utils/workflow-transition.util.ts               ← pure next/prev-step + status resolution
├── events/workflow-request.event.ts                    ← event name constants + payload classes
├── listeners/workflow-notification.listener.ts         ← creates notifications... see T5 note
├── listeners/workflow-socket.listener.ts               ← forwards to gateway
└── gateway/workflow.gateway.ts                         ← the ONLY file that touches Socket.IO

backend/src/modules/notification/
├── notification.module.ts                              ← path must match what Agent 1 registers
├── controller/notification.controller.ts
├── service/notification.service.ts
├── interfaces/notification-service.interface.ts
└── dto/get-notifications-query.dto.ts
```

## FILES YOU MUST NOT TOUCH
```
backend/prisma/schema.prisma                            ← Agent 1 (Notification model is already specified in contract §2.5; Agent 1 adds it)
backend/prisma/migrations/**                            ← Agent 1
backend/src/app.module.ts                               ← Agent 1 (already registers your NotificationModule)
backend/src/common/constants/error-code.constant.ts     ← Agent 1 (already adds YOUR codes too)
backend/src/common/exceptions/app.exception.ts          ← Agent 1 (already adds YOUR exceptions too)
backend/src/modules/workflow/{controller,service,interfaces,dto,validators,utils}/**  ← Agent 1
backend/src/modules/workflow/workflow.module.ts         ← Agent 1 creates it; see T0
frontend/**                                             ← Agent 3, all of it
backend/src/common/services/base.service.ts             ← nobody
backend/src/common/interfaces/base.interface.ts         ← nobody
backend/src/common/filters/http-exception.filter.ts     ← nobody
backend/src/common/helpers/response.helper.ts           ← nobody
backend/src/common/constants/audit-action.constant.ts   ← nobody
backend/src/modules/{auth,employee,organization,organization-type,invitations,audit-log}/**  ← nobody
```

## DEPENDENCIES — and how to not wait
**Do not wait for Agent 1.** Everything you need is fully specified in the contract.

| You need | If Agent 1 hasn't delivered yet |
|---|---|
| Prisma types (`WorkflowRequest`, `Notification`, enums) | Declare local TS types matching contract §2.3/§2.5/§1 **exactly**, in one file, and swap to `@prisma/client` imports at integration. Do **not** create a migration. |
| The permission function | Code against a local interface `canActAt(actor, requester, step): boolean` and a temporary implementation of contract §4.2. At integration, **delete yours and import Agent 1's** — two copies of this rule is a security bug. |
| The `form_data` validator (for RESUBMIT) | Same: local interface, swap to Agent 1's export at integration. |
| Error codes / exceptions | Reference them by the names in contract §6. If they don't compile yet, Agent 1 is mid-flight; do not add them yourself. |
| `WorkflowModule` | See T0. |

### T0 — module wiring without editing Agent 1's file
`workflow.module.ts` is Agent 1's. To register your controllers/providers without touching it, put them in your own `WorkflowActionModule` under `actions/` and export it; at integration Agent 1 (or the integrator) adds one `imports: [WorkflowActionModule]` line. State this clearly in your final report. Do **not** edit `workflow.module.ts` yourself, even if it exists.

---

## TASKS

### T1 — Action DTOs
One DTO per action, per contract §5.2. Every DTO carries `revision: number` (`@IsInt()`, required — it is the optimistic-lock token). `comment` is **required** for FEEDBACK and REJECT, optional for the rest. RESUBMIT additionally carries `formData: object`.

Validation lives in the DTOs. Controllers reject nothing themselves.

### T2 — Transition logic (pure, testable by inspection)
`utils/workflow-transition.util.ts` — pure functions, no I/O, no Prisma:
```ts
resolveApproveTransition(currentStep, childStep | null): { nextStepId: string | null; status; completedAt: Date | null }
resolveFeedbackTransition(currentStep): { nextStepId: string; status }
resolveRejectTransition(): { nextStepId: null; status: 'REJECTED'; completedAt: Date }
resolveCancelTransition(): { nextStepId: null; status: 'CANCELLED'; completedAt: Date }
resolveResubmitTransition(rootStepId): { nextStepId: string; status: 'IN_PROGRESS' }
```
Implement contract §7.2–7.6 exactly. Two rules that are easy to get subtly wrong:
- **APPROVE with no child** ⇒ `nextStepId: null`, `status: APPROVED`, `completedAt: now`.
- **FEEDBACK at root** (`parentId === null`) ⇒ step pointer **unchanged**, `status: NEEDS_REVISION`. It does *not* become `null`.

Keeping this pure means the state machine is reviewable without a database.

### T3 — Action engine service
`WorkflowActionService extends BaseService<PrismaService['workflowRequest'], never>`, `implements IWorkflowActionService extends IBaseService<...>`, `entityType: null` (workflow entities do not use the shared audit log — `workflow_histories` is the trail).

Each of the five actions follows exactly this order (contract §8.1):
```
BEGIN  (prisma.$transaction)
  1. re-read the request inside the transaction
  2. guard status legality        → 409 WORKFLOW_REQUEST_INVALID_STATE
  3. guard authority              → 403 WORKFLOW_ACTION_NOT_ALLOWED
  4. INSERT workflow_histories    (immutable; never update/delete)
  5. UPDATE workflow_requests ... WHERE id = :id AND revision = :expectedRevision
     ↳ 0 rows affected           → 409 WORKFLOW_REQUEST_STALE
     ↳ also sets revision = revision + 1
  6. INSERT notifications         (recipient set per contract §10)
COMMIT
--- only after commit ---
  7. emit application events
```

Non-negotiables:
- **Never emit before COMMIT.** A pre-commit emit that then rolls back leaves every client permanently showing state that does not exist.
- **Guard order is status-then-authority.** Reversed, a terminal request would leak "you're not allowed" (403) to someone who is in fact allowed but simply too late — and vice versa. Contract §6's 403-vs-409 discipline depends on this order.
- **The `WHERE revision = :expected` clause is the concurrency control.** Do not replace it with a read-then-write check; that reintroduces the race.
- Authority: approver actions use the §4 org-scope rule; CANCEL/RESUBMIT compare `actor.employeeId === request.employeeId` and ignore organization entirely.
- RESUBMIT re-validates `formData` against the workflow's `form_schema` using Agent 1's validator.
- Return the full contract §5.6 request shape — **identical** to Agent 1's `GET /:id` — including recomputed `permissions`.

Your `$transaction` use is authorised by contract §8.3 and **only** for this multi-table atomic write. Confine it to this service; controllers, listeners, and the gateway never touch `PrismaService`. Every single-table read/write that fits an inherited `BaseService` method must use it.

### T4 — Action controller
`POST /api/workflow-requests/:id/{approve,feedback,reject,cancel,resubmit}`.
- `@UseGuards(JwtAuthGuard)` at class level; `@Inject('IWorkflowActionService')`.
- `@CurrentUser()` → resolve the `Employee` (`employees.user_id`); no `Employee` ⇒ `403`.
- Return `ResponseHelper.success({ data, message })`.
- No validation, no business logic in the controller.

### T5 — Notification generation
Implement contract §10's recipient table.

Recipients are **sets**, resolved by the same org-scope logic as the permission check (master spec §7) — reuse Agent 1's exported function; do not write a second resolver. Rules: never notify the actor; zero recipients is valid and silent (no error, no admin fallback); rows are written **inside** the action transaction.

**Design note:** because notification rows must be inside the transaction, generation is **not** an `@OnEvent` listener — a post-commit listener cannot join the transaction. Compute the recipient set and insert within T3's step 6, and use the post-commit event only to *push* `notification.created` over the socket. If you instead create rows in a listener, you break atomicity: an action could commit while its notifications silently fail. Name the file accordingly (`utils/notification-recipient.util.ts` rather than a misleading `listener`).

### T6 — Notification API
`GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` per contract §5.3.

- `NotificationService extends BaseService<PrismaService['notification'], GetNotificationsQueryDto>`, `entityType: null`.
- `GET` returns the actor's own only, `createdAt` desc, `limit` default 10 / max 50, optional `isRead` filter. **`meta.unreadCount` is required** — the Bell badge depends on it.
- `PATCH /:id/read` on someone else's notification ⇒ `404 NOTIFICATION_NOT_FOUND` (not 403 — do not confirm existence of other people's rows).
- `read-all` returns `{ updatedCount }`.

### T7 — Events
`events/workflow-request.event.ts`: the eight event-name constants and payload classes from contract §9.2–9.3. Copy the `invitations` shape — `export const X_EVENT = '...'` plus a class with `readonly` constructor params.

Payloads carry **ids and status only**. No `formData`, no names, no rendered text (contract §9.4).

`APPROVED` emits **both** `workflow.request.approved` and `workflow.request.completed` (contract §7.2).

### T8 — Socket gateway
`gateway/workflow.gateway.ts` — the **only** file in the codebase that touches Socket.IO.

- Install `@nestjs/websockets @nestjs/platform-socket.io socket.io`. Namespace `/ws`.
- **Handshake auth**: JWT from `handshake.auth.token`, verified with the same RS256 public key the HTTP strategy uses (`configuration.ts` → `jwt.publicKey`). Reject the connection on invalid/missing token.
- On connect: resolve the actor's `employeeId` and join `employee:{employeeId}`.
- `workflow-request:subscribe` / `:unsubscribe` with `{ requestId }` for `workflow-request:{requestId}`.
- **Re-verify read authority before joining a request room.** Refuse silently on failure — room membership is an authorization boundary (contract §9.5), so an unauthorized join would leak another employee's request activity.
- **No global broadcast, ever.**
- Listeners (`@OnEvent(..., { async: true })`) forward events to the gateway. The gateway never contains business logic; services never call `socket.emit()`.
- Wrap emission in try/catch and log failures — a socket problem must not surface as a failed HTTP request, since the DB work is already committed.

### T9 — Specs
`docs/06-api/workflow/` for the five action endpoints, `docs/06-api/notification/` for the three notification endpoints, following the existing spec format. Document the socket contract (events, payloads, rooms, auth) too.

---

## IMPLEMENTATION RULES
1. **Never hard-code a role name.** FEEDBACK must be generic via `parentId` — no `TEAM_LEAD`/`MANAGER`/`DEPARTMENT_MANAGER` anywhere.
2. **Never emit an event or socket message before COMMIT.**
3. **Concurrency = `WHERE revision = :expected`.** Loser gets `409 WORKFLOW_REQUEST_STALE`.
4. **History is immutable.** Insert only. Never expose an update/delete path.
5. **403 vs 409 discipline** per contract §6. Never 400 for either.
6. **Backend re-validates authority on every action** regardless of what the UI allows (brief §34).
7. **One permission implementation** — Agent 1's. Delete your temporary copy at integration.
8. **Controllers do not validate**; DTOs do.
9. **Controllers inject string tokens**; providers use `useExisting`.
10. **`$transaction` only in the action service**, only for the multi-table write.
11. **Do not write any `.spec.ts` and do not run tests** (`AGENTS.md`, brief §43). `npx tsc --noEmit` and `npm run build` are fine.
12. **Do not change any contract value.** Missing something? Report and ask.

## DEFINITION OF DONE
- All five action endpoints implemented, each transactional in the contract §8.1 order.
- Concurrent APPROVE: one succeeds, the other returns `409 WORKFLOW_REQUEST_STALE`.
- FEEDBACK descends one level via `parentId`; at root it sets `NEEDS_REVISION` and leaves the step pointer intact.
- RESUBMIT restricted to the requester and to `NEEDS_REVISION`, and re-validates `formData`.
- CANCEL restricted to the requester and to non-terminal statuses.
- No event or socket emission occurs before COMMIT anywhere.
- Notification rows are written inside the action transaction; `notification.created` is pushed after commit.
- `GET /api/notifications` returns `meta.unreadCount`.
- Gateway authenticates the handshake, scopes both room types, re-authorizes request-room joins, and never broadcasts globally.
- Gateway is the only file touching Socket.IO; no service calls `socket.emit()`.
- Action responses are byte-identical in shape to Agent 1's `GET /api/workflow-requests/:id`.
- `npx tsc --noEmit` clean (except the two pre-existing spec-file failures); `npm run build` passes.
- Zero test files created; zero tests run.
- No file from the forbidden list modified.
- Specs written.

## FINAL REPORT FORMAT
```
## Agent 2 — Final Report

### Delivered
- <endpoint / artifact> → <file path>

### Transaction & concurrency
- Transaction boundary location: <file:line>
- Optimistic-lock UPDATE statement: <file:line>
- Confirm: no emit before COMMIT — <how verified>

### Permission
- Using Agent 1's function: yes/no
- If no: temporary copy at <path> — MUST be deleted at integration

### Socket
- Namespace / adapter: <detail; main.ts touched? yes/no>
- Rooms implemented:
- Handshake auth mechanism:
- Request-room join re-authorization: <file:line>

### Notification
- Recipient resolution: <file:line>
- Written inside transaction: <file:line>
- unreadCount source: <file:line>

### Module wiring needed at integration
- <e.g. add `imports: [WorkflowActionModule]` to workflow.module.ts>

### Dependencies mocked (must be swapped at integration)
- <item> → <path> → <replace with>

### Contract deviations
- <none, or exact item + why>

### Verification
- tsc --noEmit: <result>
- npm run build: <result>
- Tests: not created, not run (out of scope)

### Open questions / blockers
```
