# Workflow Module — Master Specification

> Work items: `WORK-027` (this contract), `WORK-028`/`WORK-029`/`WORK-030` (parallel implementation), `WORK-031` (integration).
>
> Companion documents: `workflow-contract.md` (frozen shared contract — enums, entities, API, payloads, file ownership), `agent-1-prompt.md`, `agent-2-prompt.md`, `agent-3-prompt.md`, `workflow-integration-plan.md`.
>
> This document explains **what** is being built and **why** the design is what it is. The contract is the normative reference for exact names and shapes; where this document and the contract appear to disagree, the contract wins.

---

## 1. Business Objective

Build a **configurable, database-driven approval workflow module** reusable across business flows. The first use case is leave request (Đăng ký nghỉ phép).

```
Employee
   ↓ SUBMIT
Team Lead
   ↓ APPROVE
Manager
   ↓ APPROVE
Department Manager
   ↓ APPROVE
APPROVED
```

The hard requirement: **the engine must not change when the approval chain changes.** Adding Director and CEO above Department Manager must be pure data entry — no code edit, no migration, no redeploy of engine logic.

```
Employee → Team Lead → Manager → Department Manager → Director → CEO → APPROVED
```

This is achieved by two decisions, and everything else follows from them:
1. The chain is a **linked list in the database** (`workflow_steps.parent_id`), so the engine only ever asks "what is my parent / what is my child".
2. Authority is expressed as an **`organization_type_id` reference**, never a role name string, so the engine never contains the words `TEAM_LEAD`, `MANAGER`, or `DEPARTMENT_MANAGER`.

---

## 2. Repository Inspection Findings

The design below is grounded in the actual repository, inspected before writing. The findings that materially shaped it:

### 2.1 Backend architecture (mandatory, no exceptions)
`AGENTS.md` mandates, with no permitted exceptions:
```
Controller → Interface / Abstraction → Service → BaseService → Prisma → PostgreSQL
```
Every entity service `extends BaseService`; every service interface `extends IBaseService`. Controllers inject a **string token** (`@Inject('IWorkflowService')`) and are declared with `{ provide: 'IX', useExisting: XService }`. The reference module to copy is `backend/src/modules/organization-type/`.

`BaseService` (`backend/src/common/services/base.service.ts`) provides concrete `create`, `createMany`, `findOne`, `findByIds`, `update`, `updateMany`, `delete`, `deleteMany`, leaving only `findMany` abstract. It emits `entity.created`/`updated`/`deleted` and translates Prisma `P2025` to a domain not-found exception. Its fourth constructor argument accepts `AuditEntityType | null`, and `null` is the sanctioned **audit opt-out**.

### 2.2 Two real gaps this spec must resolve, not defer
**Gap A — there is no manager/lead/head field anywhere.** Neither `Employee` nor `Organization` records a person in charge. `OrganizationType` is only `{ id, name, description }` — it has no level or rank column. Therefore "who is this employee's Team Lead" is **not answerable as a person lookup**. Approval authority must be **organization-scoped**: derived by walking `Organization.parentId` upward and matching `organizationTypeId`. Full rule and algorithm: contract §4. This is the single most important design consequence in the module, and the one an agent is most likely to get wrong by assuming a `managerId` exists.

**Gap B — `BaseService` has no transaction-aware method, and the codebase has zero `$transaction` usages.** `BaseService` holds exactly one Prisma delegate and its `update()` cannot enlist in an outer transaction. But every workflow action must atomically write *history + request + notification* across three tables. Resolved in contract §8.3: the action-engine service injects `PrismaService` and uses `$transaction` for that one atomic write, while every other read/write still goes through inherited base methods. Extending `BaseService` generically is explicitly out of scope — it would change a class every module depends on, mid-parallel-work.

### 2.3 What already exists and must be reused, not rebuilt
| Need | Already in repo |
|---|---|
| Response envelope | `ResponseHelper.success(...)` / `.error(...)` — the only sanctioned writers |
| Error envelope + granular `fieldErrors` | `GlobalHttpExceptionFilter` + `validationExceptionFactory` (already emits dotted paths like `items.0.email`) |
| Auth | `JwtAuthGuard` (the only authorization mechanism — no role/permission model exists), `@CurrentUser()` → `{ id, email, fullName }` |
| Event bus | `EventEmitterModule.forRoot()` already registered; `invitation.created` + `@OnEvent(..., { async: true })` is the pattern to copy |
| Pagination DTO | `page`, `limit`, `search`, `sortBy`, `sortOrder` with `DEFAULT_PAGE`/`DEFAULT_PAGE_LIMIT`/`MAX_PAGE_LIMIT` constants |
| React Flow | `@xyflow/react` **and** `@dagrejs/dagre` already installed; `features/organization/utils/organization-layout.ts` already derives nodes/edges from a parent id and lays them out with dagre |
| Form building | React Hook Form + Zod + `useFieldArray`, two-phase confirm submit — see `OrganizationTypeCreatePage.tsx` |
| Field-error mapping | `useApplyApiFieldErrors` / `applyApiFieldErrors` |
| Shared UI | `ConfirmDialog`, `ContextMenu`, `FullPageLoadingOverlay`, `PageStates`, `Pagination`, `SearchAndFilterBar`, `SortableTableHeader`, `SelectField`, `TextField`, `RequiredHeader` |
| List state | `useListQueryState`, `useDebounce` / `useDebouncedValue` |

**No new frontend dependency is required** — React Flow, dagre, RHF, Zod, RTK, MUI icons, react-select are all installed. The only additions in the whole module are `socket.io` (backend) and `socket.io-client` (frontend).

### 2.4 Two conflict hotspots
- **`frontend/src/layouts/AppLayout.tsx`** defines `Sidebar`, `UserMenu`, and `Navbar` **in one file**. The Notification Bell goes into `Navbar`, and new sidebar items into `NAV_GROUPS` — both in this file. Agent 3 owns it solely, and must not touch `UserMenu` (brief §17/§25/§43).
- **`RouteHandle.sidebarActiveKey`** is a *closed literal union*, not `string`. Agent 3 must widen it to add workflow keys, or routing will not type-check.

---

## 3. Database Design

Four workflow tables (plus one notification table). Field-level detail: contract §2.

```
workflows ──1:N──> workflow_steps ──self-FK(parent_id)──> workflow_steps
    │                     ▲
    │                     │ current_step_id
    └──1:N──> workflow_requests ──1:N──> workflow_histories
                    │
                    └── employee_id ──> employees ──> organizations ──> organization_types
```

### 3.1 Field rationale — the non-obvious ones

**`workflows.form_schema` vs `workflow_requests.form_data`** — the distinction that must never blur:
- `form_schema` = *which fields exist*. Authored once by an admin. Lives on the workflow definition.
- `form_data` = *what the employee typed*. Created per request, validated against the schema at SUBMIT and RESUBMIT.

**`workflow_steps.parent_id`** — the entire configurability mechanism. `null` marks the root (first approver). APPROVE walks to the child; FEEDBACK walks to the parent. Because the engine reads only this column, a six-level chain and a three-level chain execute identical code.

**`workflow_steps.step_order`** — display and tiebreak only. It is *not* the chain. Two sources of truth for ordering would eventually disagree; `parent_id` is authoritative and `step_order` must never be used to compute the next step.

**`workflow_steps.name`** — a display label (`"Team Lead"`). Never a logic input. Any `if (step.name === 'Manager')` is a contract violation.

**`workflow_requests.revision`** — an addition beyond the brief's field list, and a deliberate one. Brief §33 requires that two simultaneous APPROVEs cannot both succeed. Without a version token there is no safe way to enforce that; a single `Int` compared in the `UPDATE … WHERE` clause is the smallest correct mechanism (contract §8.2).

**`workflow_histories.workflow_step_id` is nullable** — because SUBMIT, RESUBMIT, and CANCEL are performed by the requester, who occupies no step. Forcing a step there would require inventing a fake "employee step", polluting the chain.

**`notifications.reference_id` is a plain string, not an FK** — notifications must remain a generic feature usable by future non-workflow sources. An FK to `workflow_requests` would lock the table to one domain.

### 3.2 Explicitly rejected columns
Per brief §2.2 and §43, `workflow_steps` must **not** carry `x_position`, `y_position`, `config_json`, `allow_reject`, `allow_feedback`, or `is_required`. React Flow coordinates are computed client-side by dagre — exactly as the existing org chart already does — so persisting them would create a second, drifting source of truth for something the layout algorithm derives deterministically.

### 3.3 The linked-list invariant
Each step has **at most one child**. Agent 1 enforces this by construction: `POST /api/workflows/:id/steps` accepts an ordered array and assigns `parent_id` from array position, so a branch is unrepresentable through the API.

This matters because FEEDBACK is defined as "down exactly one level". In a branching tree, "the previous step" would be ambiguous. The linked list makes `parent_id` *the* unique predecessor — which is precisely what makes the recursive FEEDBACK rule correct rather than merely plausible.

### 3.4 Workflow entities do not use the shared audit log
`workflow_histories` is a richer, domain-specific, immutable trail that already records actor, step, action, and comment. Duplicating it into `audit_logs` would create two half-authoritative histories. Workflow services therefore pass `entityType: null` to `BaseService` (the sanctioned opt-out) and add **nothing** to `AuditEntityType` / `AuditAction` / `AuditLogListener`.

---

## 4. Workflow State Machine

Statuses: `DRAFT`, `IN_PROGRESS`, `NEEDS_REVISION`, `APPROVED`, `REJECTED`, `CANCELLED`. Terminal: the last three.

```
                        ┌──────────────── FEEDBACK (at root) ───────────────┐
                        ▼                                                   │
   SUBMIT        ┌──────────────┐   RESUBMIT    ┌─────────────┐             │
  ────────────▶  │ NEEDS_       │ ────────────▶ │ IN_PROGRESS │ ────────────┘
                 │ REVISION     │               │             │
                 └──────────────┘               └─────────────┘
                        │                          │  │  │
                     CANCEL                 APPROVE│  │  │REJECT
                        │              (chain done)│  │  └──────────▶ REJECTED
                        │                          │  └─ APPROVE (more steps) ─┐
                        ▼                          ▼                            │
                    CANCELLED                  APPROVED          stays IN_PROGRESS,
                                                                 current step advances
```

Exact algorithms for SUBMIT / APPROVE / FEEDBACK / RESUBMIT / REJECT / CANCEL, plus the full action legality matrix: **contract §7**. They are normative there and deliberately not restated here, so there is exactly one copy to keep correct.

The two behaviours worth restating because they are counter-intuitive:

**APPROVE at the last step completes the request.** `current_step_id` becomes `null` and status becomes `APPROVED`. `current_step_id = null` therefore means "terminal", never "unassigned".

**FEEDBACK at the root step does not move the step pointer.** It sets `NEEDS_REVISION` and *keeps* `current_step_id` at the root. The request is conceptually "back with the employee", but the step pointer records where it resumes on RESUBMIT — so RESUBMIT needs no lookup and cannot resume at the wrong place.

---

## 5. Permission Model

Full rule and reference algorithm: **contract §4**.

There is no role or permission table in this system — `JwtAuthGuard` is the only authorization mechanism, and there is no manager field (§2.2 Gap A). Authority is therefore computed:

> An actor may act at `currentStep` when the actor's organization has **exactly** `currentStep.organization_type_id`, **and** that organization is an **ancestor-or-self** of the requester's organization.

The ancestor check is what prevents the Team Lead of Department B approving Department A's request. Both halves are required; either alone is a security hole.

Requester-only actions — CANCEL and RESUBMIT — check `actor.employeeId === request.employeeId` instead, and ignore organization entirely.

### 5.1 Consequences that must be preserved, not "fixed"
- **A step may have several eligible actors.** Everyone in the matching org with the matching type qualifies. First valid action wins; concurrent attempts get `409` (contract §8.2). This is intended, not a defect.
- **A step may have zero eligible actors** when no ancestor organization carries that `organization_type_id`. The request stalls visibly. Do **not** auto-skip, auto-approve, or fall back to "any admin" — silent escalation of an approval is a worse failure than a stalled request an administrator can see and fix by assigning the organization type.
- **`permissions` in the response is UX only.** The backend re-validates on every action. Hiding a button is never the security boundary (brief §34).

---

## 6. Event-Driven Architecture and Socket.IO

### 6.1 Layering
```
Controller → Service Interface → Service → BaseService / $transaction → DB
   → COMMIT
   → EventEmitter2 (application event)
   → @OnEvent listener
   → WorkflowGateway
   → Socket.IO → Frontend
```

**A business service must never call `socket.emit()`.** It emits an application event; only the gateway speaks Socket.IO. This keeps the transport swappable and the service unit-reasonable, and it mirrors the existing `invitation.created` → `InvitationMailListener` pattern.

### 6.2 Never emit before COMMIT
Ordering is mandatory (brief §9/§43): validate → insert history → update request → insert notifications → **COMMIT** → emit. An event published before commit can survive a rollback, leaving every connected client showing a state that does not exist in the database — a corruption that no later refetch corrects, because the clients were told to refetch *before* the row changed and will not be told again.

### 6.3 Socket is a hint, REST is the truth
```
Socket event → queryClient.invalidateQueries(...) → REST refetch → render
```
Payloads carry ids and status only (contract §9.3) — never `form_data`, never rendered text. The frontend must not merge payload values into cache. A dropped, duplicated, or out-of-order event then degrades to "briefly stale", never to "wrong data shown".

### 6.4 Rooms, not broadcast
Two room shapes only: `employee:{employeeId}` and `workflow-request:{requestId}` (contract §9.5). Global broadcast would leak the existence and movement of other people's requests to every connected client. Room joins are re-authorized server-side — room membership is an authorization boundary, not a convenience.

### 6.5 Socket.IO is not installed yet
Confirmed absent from both `package.json` files. Agent 2 adds `@nestjs/websockets @nestjs/platform-socket.io socket.io`; Agent 3 adds `socket.io-client`. Namespace `/ws`, JWT in the handshake, verified with the same RS256 public key as the HTTP strategy.

---

## 7. Notification Feature

Generation rules per action: **contract §10**.

The defining consequence of the organization-scoped permission model: **recipients are sets, not individuals.** "Notify the Manager" means "notify every employee eligible to act at the Manager step for this request". Resolution reuses exactly the same code path as the permission check — if the two ever diverged, someone would be authorized to approve something they were never told about.

Rules that prevent noise and dead inbox items:
- The actor never notifies themselves.
- CANCEL notifies whoever was pending, so a reviewer's inbox does not retain an item that can no longer be acted on.
- Zero recipients is valid and silent (the §5.1 stall case) — no error, no admin fallback.
- Rows are written **inside** the action transaction; `notification.created` fires **after** commit.

In-app + socket only. Email for workflow events is out of scope this phase.

---

## 8. Frontend Scope

Routes: contract §12. State ownership and query keys: contract §13.

| Screen | Purpose |
|---|---|
| Workflow List | Browse/search definitions, status filter |
| Workflow Create / Edit | Dynamic form-schema builder + step chain builder + React Flow preview |
| Submit Request | Pick an `ACTIVE` workflow → render its `form_schema` → submit `form_data` |
| My Requests | `scope=mine` |
| Reviewer Inbox | `scope=inbox` — what awaits my decision |
| Request Detail | Form values, history timeline, action buttons |

### 8.1 Dynamic form renderer
One renderer maps the six `form_schema` types (contract §1.5) to inputs, builds a Zod schema at runtime from the schema, and validates before submit. Server-side validation is authoritative and returns `formData.<key>` field paths (contract §3.2) that map straight onto RHF fields via the existing `useApplyApiFieldErrors`.

### 8.2 React Flow
`workflow_steps` → nodes; `parent_id` → edges; dagre computes positions. This is the same transformation `features/organization/utils/organization-layout.ts` already performs for the org chart, and it should be mirrored rather than reinvented. **No React Flow field is persisted** (§3.2).

### 8.3 Header Notification Bell
Added to `Navbar` inside `AppLayout.tsx`, to the **left of** the existing account menu:
```
┌───────────────────────────────────────────────────────┐
│                                🔔 3   User Name ▼     │
└───────────────────────────────────────────────────────┘
```
- Badge shows only when `unreadCount > 0`.
- Icon from `@mui/icons-material` (already installed — no new library).
- Click → dropdown of recent notifications, read vs unread visually distinct, "View All" link.
- Click a notification → mark read → close dropdown → navigate to `/workflow-requests/:referenceId`.

**Hard boundary (brief §17/§25/§43):** `UserMenu`, Change Password, and Logout are not modified in any way. The Bell is added *beside* them.

---

## 9. Edge Cases

| Case | Required behaviour |
|---|---|
| Two approvers APPROVE simultaneously | First wins; second gets `409 WORKFLOW_REQUEST_STALE`; frontend refetches and shows current state |
| Action on a terminal request | `409 WORKFLOW_REQUEST_INVALID_STATE` |
| Non-requester tries CANCEL/RESUBMIT | `403 WORKFLOW_ACTION_NOT_ALLOWED` |
| RESUBMIT when status ≠ `NEEDS_REVISION` | `409 WORKFLOW_REQUEST_INVALID_STATE` |
| Actor has no `Employee` record | `403` — a `User` without an `Employee` cannot participate |
| Actor's `employee.organizationId` is null | `403` — unplaced employees have no authority |
| No ancestor org matches the step's type | Request stalls visibly; never auto-skip or auto-approve |
| Cyclic `Organization.parent_id` | Cap the upward walk at 20 hops; over-length ⇒ `403`, never an infinite loop |
| Submit against `DRAFT`/`ARCHIVED` workflow | `400 WORKFLOW_NOT_ACTIVE` |
| Submit against a workflow with no steps | `400 WORKFLOW_HAS_NO_STEPS` |
| Replace steps while requests are in flight | `409 WORKFLOW_HAS_ACTIVE_REQUESTS` |
| `form_data` key not in `form_schema` | `400` with `formData.<key>` field error |
| Required `form_schema` field missing | `400` with `formData.<key>` field error |
| Socket disconnects | UI keeps working on REST; reconnect and invalidate on reconnect |
| Socket event for an unknown request | Invalidate anyway (cheap); never construct state from the payload |
| Notification for a deleted employee | FK `onDelete: Cascade` removes the notification row |
| Zero notification recipients | Write none, no error |

---

## 10. Definition of Done — the module

- Approval chain is fully database-driven; adding a level is data entry only.
- No engine code contains `TEAM_LEAD`, `MANAGER`, or `DEPARTMENT_MANAGER`.
- Exactly four workflow tables (+ one notification table). No React Flow columns.
- Every service extends `BaseService`; every interface extends `IBaseService`; controllers inject string tokens.
- Every action is transactional; no event or socket emission precedes COMMIT.
- Concurrency is enforced by `revision`; the loser receives `409`.
- Permission is validated server-side on every action, independent of any UI state.
- FEEDBACK descends exactly one level via `parent_id`, generically.
- Socket delivers hints only; REST remains the source of truth; rooms are scoped and authorized.
- Notifications are generated for every rule in contract §10, and the Bell reflects unread count live.
- `UserMenu` / Change Password / Logout are byte-for-byte unchanged.
- No automated tests were added (out of scope — brief §43); manual flows in `workflow-integration-plan.md` pass.
- Specs stay in sync with what shipped, per the repo's Specification Sync Rule.

---

## 11. Out of Scope

Full list: **contract §15**. Summary — no automated tests of any kind; no change to `UserMenu`/Change Password/Logout; no `DRAFT` request save/resume; no `REVIEW` endpoint; no workflow version pinning; no delegation, out-of-office, auto-escalation, SLA timers, or reminders; no parallel/branching or conditional routing; no email for workflow events; no generic transaction support added to `BaseService`.
