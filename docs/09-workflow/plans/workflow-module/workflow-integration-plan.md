# Workflow Module — Integration Plan

> Work item: `WORK-031`. Implementation items: `WORK-028`, `WORK-029`, `WORK-030`.
>
> Companion to `workflow-master-spec.md`, `workflow-contract.md`, and the three agent task files.
>
> **No automated test scope.** Per brief §43, this plan contains no unit, integration, or E2E test tasks. §7 lists **manual** verification flows a human walks through.

---

## 1. Dependency Graph

```
                    workflow-contract.md  (FROZEN — all three bind to it)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
    AGENT 1               AGENT 2               AGENT 3
  Schema + Core        Actions + Events      Frontend + Bell
  Definition CRUD      Socket + Notif        React Flow + Socket client
        │                     │                     │
        │  (mocked types)     │   (mocked API)      │
        └──────── all three run in parallel ────────┘
                              │
                              ▼
                        INTEGRATION
                    (swap mocks → real)
```

**Nobody blocks anybody.** The contract is complete enough that all three start on day one:
- Agent 1 has zero dependencies.
- Agent 2 mocks Prisma types, the permission function, and the `form_data` validator (task §Dependencies).
- Agent 3 mocks the entire API surface and socket layer (contract §14).

### 1.1 Real coupling points (the only four)
| # | Coupling | Owner → Consumer | De-risked by |
|---|---|---|---|
| 1 | Prisma types + `revision` column | Agent 1 → Agent 2 | Contract §2.3 specifies every field, so Agent 2's local types match by construction |
| 2 | Permission function `canActAt` | Agent 1 → Agent 2 | Agent 2 codes to an interface, swaps at integration. **Two implementations must not ship** |
| 3 | `WorkflowRequest` response shape | Agents 1 & 2 → Agent 3 | Contract §5.6 is byte-exact and shared by `GET /:id` *and* all five action responses |
| 4 | Socket event names + query keys | Agent 2 → Agent 3 | Contract §9.2 and §13 are frozen tables; invalidation matches by name |

Everything else is genuinely independent.

---

## 2. Branch Strategy

```
main
 ├── feature/workflow-core              ← Agent 1
 ├── feature/workflow-actions-events    ← Agent 2
 └── feature/workflow-frontend          ← Agent 3
```

Rules:
- **No direct commits to `main`.** Every branch merges via PR.
- Each agent branches from the same `main` commit. Record that SHA in each PR description — a shared base makes the merge order below predictable.
- Agents 2 and 3 **rebase onto `main` after Agent 1 merges**, before their own merge. Rebase, not merge-commit, so the history stays linear and a bad integration is easy to isolate.
- No agent commits to another agent's branch.

### 2.1 Pre-existing worktree state — resolve before branching
`git status` currently shows substantial uncommitted work (partial `WORK-024` backend, `WORK-025` frontend, docs). **Do not branch on top of a dirty tree**: the three agents would each carry an unrelated half-finished change, and the merge order below would produce conflicts that have nothing to do with workflow.

Commit or stash the existing work first, then branch all three from that clean commit. This is a prerequisite, not a suggestion.

---

## 3. Merge Order

```
1. feature/workflow-core           (Agent 1)  → main
2. feature/workflow-actions-events (Agent 2)  → main   [rebase first]
3. feature/workflow-frontend       (Agent 3)  → main   [rebase first]
```

**Why this order and not another:**
- Agent 1 first because it owns `schema.prisma`, the migration, `app.module.ts`, and the error-code/exception files. Merging it first means those files are settled before anyone else lands, so Agents 2 and 3 rebase onto a stable base instead of resolving shared-file conflicts.
- Agent 2 second because it needs real Prisma types to compile without its temporary shims, and because Agent 3's socket client should be integrated against a real gateway rather than a mock.
- Agent 3 last because it is the only pure consumer — nothing depends on it, so a late merge risks nothing downstream.

Development is still fully parallel; only *landing* is ordered.

---

## 4. Shared-File Ownership and Expected Conflicts

Full ownership table: **contract §11**. Repeated here are only the files where a conflict is actually plausible, with the mitigation.

| File | Owner | Conflict risk | Mitigation |
|---|---|---|---|
| `backend/prisma/schema.prisma` | Agent 1 | **Would be high** | Eliminated: Agent 1 adds the `Notification` model + `NotificationType` enum too (contract §2.5 fully specifies them), so Agent 2 never opens the file |
| `backend/src/app.module.ts` | Agent 1 | **Would be high** | Eliminated: Agent 1 registers **both** `WorkflowModule` and `NotificationModule` up front, by agreed path |
| `error-code.constant.ts`, `app.exception.ts` | Agent 1 | **Would be high** | Eliminated: Agent 1 adds **all** codes/exceptions from contract §6 in one pass, including Agent 2's |
| `backend/src/modules/workflow/workflow.module.ts` | Agent 1 | **Medium — the one real backend conflict** | Agent 2 puts its providers in a separate `WorkflowActionModule`; integration adds one `imports: [...]` line. See §5 step 3 |
| `frontend/src/layouts/AppLayout.tsx` | Agent 3 | **Low (single owner) but high blast radius** | Only Agent 3 edits it. Bell placement is prescribed; `UserMenu` is off-limits. Review this diff first at integration |
| `frontend/src/routes/route.types.ts` | Agent 3 | Low | Closed literal union must be widened or nothing type-checks |
| `backend/package.json` | Agent 2 | Low | Socket deps only |
| `frontend/package.json` | Agent 3 | Low | `socket.io-client` only |
| `docs/**` | split by area | Low | Each agent writes only its own new spec files |

**Net effect: exactly one file (`workflow.module.ts`) needs a manual touch at integration.** Everything else is single-owner by construction.

---

## 5. Integration Steps

Run in order, on `main`, after each merge.

### Step 1 — After Agent 1 merges
1. `cd backend && npx prisma generate` — then **confirm** the generated client contains `Workflow`, `WorkflowStep`, `WorkflowRequest`, `WorkflowHistory`, `Notification`. A stale client is the single most common cause of confusing downstream failures.
2. Apply the migration to the dev database.
3. `npx tsc --noEmit` and `npm run build`.
4. Seed one workflow manually (see §6) so Agents 2 and 3 have real data to integrate against.

### Step 2 — Before Agent 2 merges
1. Rebase `feature/workflow-actions-events` onto `main`.
2. **Delete Agent 2's temporary permission implementation and import Agent 1's exported function.** Verify by grep that only one implementation of the §4 rule remains — two would be a security bug, not a duplication nit.
3. Replace Agent 2's local TS types with `@prisma/client` imports.
4. Replace Agent 2's `form_data` validator shim with Agent 1's export.
5. Add `imports: [WorkflowActionModule]` (or equivalent) to `workflow.module.ts` — the one manual wiring touch.
6. Fill in the `// TODO(Agent 2): emit ...` markers Agent 1 left in the submit path.
7. `npx tsc --noEmit`, `npm run build`.

### Step 3 — Before Agent 3 merges
1. Rebase `feature/workflow-frontend` onto `main`.
2. **Flip the mock flag off and delete the fixture files.** Grep for the flag name to confirm no import remains.
3. Point the socket client at the real `/ws` namespace; confirm the handshake token is the same one `api-client.ts` attaches.
4. `npm run build`.
5. **Review the `AppLayout.tsx` diff line by line.** It must contain only the `NotificationBell` import, its placement beside `UserMenu`, and the `NAV_GROUPS` addition. Any change inside `UserMenu`, the Change Password link, or `handleLogout` must be reverted.

### Step 4 — Contract conformance check
Before declaring integration done, verify field-by-field rather than by eyeball:
1. `GET /api/workflow-requests/:id` response vs contract §5.6 — every key present, correct type, `permissions` object included.
2. Each of the five action responses returns the **same** shape as `GET /:id` (a divergence here silently breaks Agent 3's cache updates).
3. `GET /api/notifications` includes `meta.unreadCount`.
4. Socket event names emitted by the gateway match contract §9.2 **exactly** — a typo means silent no-op invalidation that looks like a caching bug for hours.
5. Payload keys match contract §9.3.
6. Frontend query keys match contract §13, so Agent 2's events actually invalidate Agent 3's caches.
7. Error codes and statuses match contract §6, including the 403-vs-409 split.

---

## 6. Test Data Setup (manual, prerequisite for §7)

The flows in §7 cannot run without an organization hierarchy, because authority is organization-scoped (contract §4).

1. **Organization types** — create four via `/organizations/types`: `Team`, `Division`, `Department`, `Company`.
2. **Organization hierarchy** — via `/organizations`, build:
   ```
   Company (type=Company)
     └── Department A (type=Department)
           └── Division A1 (type=Division)
                 └── Team A1a (type=Team)
   ```
3. **Employees + user accounts** — one per level, each with `organizationId` set and a login (via the invitation flow):
   | Employee | Organization | Acts as |
   |---|---|---|
   | `emp.requester` | Team A1a | Requester |
   | `emp.teamlead` | Team A1a | Step 1 approver |
   | `emp.manager` | Division A1 | Step 2 approver |
   | `emp.deptmgr` | Department A | Step 3 approver |
   | `emp.outsider` | a **second** Department B subtree | Negative test — must be refused |
4. **Workflow definition** — via `/workflows/create`: code `LEAVE_REQUEST`, the four-field `form_schema` from contract §3.1, step chain `Team → Division → Department` (by organization type), status `ACTIVE`.

> `emp.requester` and `emp.teamlead` are both in Team A1a, so both match step 1. That is correct and intended (contract §4.3) — but note the requester will therefore *also* satisfy the approver check for step 1. Whether a requester may approve their own request at a step they happen to qualify for is **not specified by the brief**; the contract does not forbid it. Flag this to the Tech Lead during integration rather than having an agent decide silently. Use a requester with no approver-matching type if you want the flows below to be unambiguous.

---

## 7. Manual Verification Flows

Walk these by hand after integration. No automation.

### 7.1 Happy path
```
emp.requester  SUBMIT   → status IN_PROGRESS, current step = Team (root)
emp.teamlead   APPROVE  → current step = Division
emp.manager    APPROVE  → current step = Department
emp.deptmgr    APPROVE  → status APPROVED, current step = null, completedAt set
```
Verify at each step: history row appended with the right actor/step/action; `revision` incremented; the next approver's Inbox gains the item and the previous approver's loses it; `permissions` reflects the new viewer.

### 7.2 Feedback descending, then resubmit
```
… request at Department …
emp.deptmgr  FEEDBACK (comment required) → current step = Division,  IN_PROGRESS
emp.manager  FEEDBACK                    → current step = Team,      IN_PROGRESS
emp.teamlead FEEDBACK                    → status NEEDS_REVISION, current step STAYS at Team
emp.requester RESUBMIT (edited formData)  → status IN_PROGRESS, current step = Team
emp.teamlead  APPROVE                     → current step = Division
```
The third FEEDBACK is the critical assertion: at the root step the pointer **must not** become `null` — it stays at the root so RESUBMIT resumes correctly (contract §7.3).

### 7.3 Reject
```
… request at Division …
emp.manager REJECT (comment required) → status REJECTED, current step = null, completedAt set
then: any further APPROVE/FEEDBACK/CANCEL → 409 WORKFLOW_REQUEST_INVALID_STATE
```

### 7.4 Cancel
```
emp.requester CANCEL  → status CANCELLED, current step = null, completedAt set
emp.teamlead's inbox  → item removed; cancel notification received
```
Also: `emp.teamlead` attempts CANCEL on someone else's request → **403 `WORKFLOW_ACTION_NOT_ALLOWED`**.

### 7.5 Permission negatives (each must be refused by the **backend**, not merely hidden in the UI)
| Attempt | Expected |
|---|---|
| `emp.outsider` (Department B, right type, wrong subtree) APPROVEs | `403` — fails the ancestor check |
| `emp.manager` APPROVEs while current step is Team (wrong type) | `403` |
| `emp.teamlead` RESUBMITs someone else's request | `403` |
| A `User` with no `Employee` record acts | `403` |
| An employee with `organizationId = null` acts | `403` |

Verify by calling the API directly (e.g. a REST client), not through the UI — the point is that the server refuses independently of any button state.

### 7.6 Concurrency
```
Browser A and Browser B both open the same request at the same step, both as valid approvers.
Both click APPROVE.
→ exactly ONE succeeds
→ the other receives 409 WORKFLOW_REQUEST_STALE
→ the loser's UI refetches and shows the current (already-advanced) state, with a calm message
→ workflow_histories contains exactly ONE approve row for that step
```
The history-row count is the real assertion: a second row would mean the transaction boundary leaked.

### 7.7 Notification + socket end-to-end
```
emp.teamlead APPROVE
   ↓ DB COMMIT
   ↓ application event
   ↓ socket → room employee:{emp.manager}
emp.manager's browser (already open, no refresh):
   ↓ Bell badge increments
   ↓ dropdown lists the new notification, marked unread
   ↓ click → marked read → dropdown closes → navigates to /workflow-requests/:id
```
Also verify:
- `emp.deptmgr` (not yet involved) receives **nothing** — rooms are scoped, no global broadcast.
- The actor (`emp.teamlead`) does **not** notify themselves.
- Kill the socket server mid-session: the UI keeps working over REST, no error dialog. Restart it: reconnect fires, caches invalidate, state catches up.
- Chain completion notifies the **requester** (`WORKFLOW_REQUEST_COMPLETED`), not an approver.

### 7.8 Configurability — the module's whole point
```
Add two steps to LEAVE_REQUEST: … → Department → Company (Director/CEO level)
Submit a fresh request and walk it to the end.
→ it now requires five approvals
→ NO backend code was changed, NO migration was run, NO redeploy of engine logic
```
If any code change was needed to add a level, the module has failed its objective regardless of everything else passing.

Also verify: attempting to replace steps **while a request is in flight** → `409 WORKFLOW_HAS_ACTIVE_REQUESTS`.

### 7.9 Form schema validation
| Attempt | Expected |
|---|---|
| Omit a `required` field | `400` with `formData.<key>` field error, shown on that input |
| `select` value not in `options` | `400` with `formData.<key>` |
| `date` not `YYYY-MM-DD` | `400` with `formData.<key>` |
| `number` sent as `"5"` (string) | `400` |
| Extra key not in the schema | `400` |
| Build a `select` with no options | `400` at workflow-save time |
| Duplicate field `key` in a schema | `400` at workflow-save time |

### 7.10 Regression — untouched features
Explicitly confirm these still behave exactly as before (brief §17/§25/§43):
- Account menu opens; **Change Password** navigates and works; **Logout** logs out and redirects to `/login`.
- Employee list/create/update; Organization chart; Organization types.
- The Bell sits **beside** the account menu without displacing or restyling it.

---

## 8. Rollback

Each branch merges independently, so rollback is per-agent:
- **Agent 3** — revert the frontend merge. Backend is unaffected; workflow APIs simply have no UI.
- **Agent 2** — revert the actions/socket merge. Definitions and submit still work; requests can be created but not actioned. Degraded, not broken.
- **Agent 1** — the migration is additive (new tables + new relation fields only). Reverting code leaves orphan tables, which are harmless. **Do not write a destructive down-migration** — `AGENTS.md` forbids destructive database operations without explicit approval.

---

## 9. Integration Checklist

**Contract conformance**
- [ ] `GET /api/workflow-requests/:id` matches contract §5.6 field-for-field
- [ ] All five action responses return that identical shape
- [ ] `GET /api/notifications` returns `meta.unreadCount`
- [ ] Socket event names match contract §9.2 exactly
- [ ] Socket payload keys match contract §9.3
- [ ] Frontend query keys match contract §13
- [ ] Error codes/statuses match contract §6, 403-vs-409 respected

**Architecture**
- [ ] Every workflow/notification service extends `BaseService`; every interface extends `IBaseService`
- [ ] Controllers inject string tokens; providers use `useExisting`
- [ ] No controller performs validation
- [ ] `$transaction` appears only in the action service (and Agent 1's step-replace)
- [ ] No emit precedes COMMIT anywhere
- [ ] The gateway is the only file touching Socket.IO; no service calls `socket.emit()`
- [ ] Exactly **one** implementation of the §4 permission rule
- [ ] `entityType: null` on workflow/notification services; nothing added to `AuditEntityType`/`AuditAction`/`AuditLogListener`

**Anti-requirements (each must be verifiably absent)**
- [ ] No `TEAM_LEAD` / `MANAGER` / `DEPARTMENT_MANAGER` string anywhere in engine logic
- [ ] No React Flow coordinate field in the schema or any payload
- [ ] Exactly four workflow tables + one notification table
- [ ] No socket payload used as a data source on the frontend
- [ ] `UserMenu` / Change Password / Logout diff is empty
- [ ] Zero test files added; zero tests run
- [ ] Mock flag off and fixtures deleted
- [ ] `BaseService` / `base.interface` / filter / `ResponseHelper` unmodified

**Build**
- [ ] `backend`: `npx prisma generate`, `npx tsc --noEmit`, `npm run build`
- [ ] `frontend`: `npm run build`
- [ ] Only new deps: `socket.io` family (backend), `socket.io-client` (frontend)

**Manual flows** — §7.1 through §7.10 all pass

**Project rules**
- [ ] Specs written/updated (Specification Sync Rule)
- [ ] `docs/09-workflow/session-context.md` updated
- [ ] `docs/09-workflow/memory.yaml` updated if durable rules changed
- [ ] History appended via `docs/09-workflow/scripts/history/append-history.ps1` (never hand-written)

---

## 10. Open Items for the Tech Lead

Flagged rather than silently decided. None blocks the agents starting.

1. **May a requester approve their own request** at a step whose organization type they happen to match (§6)? The brief does not say; the contract does not forbid it. Needs a ruling before production use.
2. **Zero-eligible-approver stall** (contract §4.3): the request stalls visibly and by design. Is an admin-facing "stalled requests" view wanted in a later phase?
3. **`revision` was added** beyond the brief's field list, to satisfy §33 concurrency. Confirm acceptable.
4. **`$transaction` in the action service** (contract §8.3) is a deliberate narrow exception to "all writes through `BaseService`". Confirm acceptable, and whether generic transaction support in `BaseService` should become its own follow-up task.
5. **Pre-existing dirty worktree** (§2.1) must be committed or stashed before branching.
6. **Existing backend gaps** unrelated to workflow but affecting the §6 setup: the invitation-accept endpoint and the Mailpit container are still missing (`WORK-024` is partial), so creating login accounts for the five test employees may need doing directly in the database until that lands.
