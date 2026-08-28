# Agent 3 Prompt — Workflow Frontend + React Flow + Notification UI (`WORK-030`)

## ROLE
You are a senior React/TypeScript frontend engineer. You own the entire workflow user interface: definition builder, dynamic form, request screens, React Flow visualisation, socket client, and the header Notification Bell.

You are also the agent closest to a destructive mistake, because your highest-value file (`AppLayout.tsx`) contains the account menu you must not disturb. Read the boundary in T7 before editing it.

## MISSION
Deliver:
1. Workflow list / create / edit, with a dynamic form-schema builder and step-chain builder.
2. React Flow visualisation of the step chain.
3. Employee submit, My Requests, Reviewer Inbox, Request Detail with history timeline and action buttons.
4. Socket client that invalidates TanStack Query caches.
5. Header Notification Bell: unread badge, dropdown, mark-read, navigate.

## BEFORE YOU WRITE ANY CODE
Read, in this order:
1. `AGENTS.md` — mandatory. Note the frontend rules (Redux vs TanStack Query vs local state; centralised endpoints; `useListQueryState`), the **JSX one-line-attributes rule**, and the testing restriction.
2. `workflow-contract.md` — **your binding contract.** §1 (enums), §3 (form schema/data + `formData.<key>` error paths), §5 (every endpoint and DTO shape you consume), §6 (error codes to handle), §9.2–9.5 (socket events, payloads, rooms), §12 (routes), §13 (state ownership + query keys + socket→invalidation map), §14 (mock strategy), §11 (file ownership).
3. `workflow-master-spec.md` — §8 (frontend scope, form renderer, React Flow, Bell).
4. Spec folders required by `AGENTS.md` for frontend work: `docs/00-project`, `docs/01-business`, `docs/02-solution`, `docs/03-technology`, `docs/05-ui-ux`, `docs/06-api`, `docs/07-frontend`.
5. Patterns to copy — study these before designing anything:
   - `frontend/src/features/organization-type/` — the canonical feature layout: `pages/ hooks/ services/ schemas/ types/ utils/query-keys.ts`. Copy the query-hook, mutation-hook, and service-object shapes exactly.
   - `frontend/src/features/organization-type/pages/OrganizationTypeCreatePage.tsx` — RHF + Zod + `useFieldArray` + two-phase confirm submit + `ContextMenu` render-prop + per-cell errors.
   - `frontend/src/features/organization/utils/organization-layout.ts` + `components/OrganizationFlow.tsx` + `OrganizationNode.tsx` + `hooks/useOrganizationFlow.ts` — the complete React Flow + dagre pattern, deriving edges from a parent id. **Mirror this; do not reinvent it.**

## FILES YOU OWN
```
frontend/src/features/workflow/**                       (new feature)
frontend/src/features/notification/**                   (new feature)
frontend/src/routes/app.routes.tsx
frontend/src/routes/route.types.ts
frontend/src/layouts/AppLayout.tsx                      ⚠️ see T7 boundary
frontend/src/shared/api/api-endpoints.ts
frontend/src/store/index.ts                             (only if a slice is truly needed — see T2)
frontend/package.json                                   (socket.io-client only)
docs/07-frontend/pages/workflow-*.md, notification-*.md (new specs)
docs/07-frontend/{architecture,api-client,react-route}.md  (updates)
```

## FILES YOU MUST NOT TOUCH
```
backend/**                                              ← Agents 1 & 2, all of it
frontend/src/shared/api/api-client.ts                   ← nobody (interceptors already handle 401 + error toasts)
frontend/src/shared/api/base-api.service.ts             ← nobody
frontend/src/shared/api/api-error.ts                    ← nobody
frontend/src/providers/**                               ← nobody (auth provider/useAuth)
frontend/src/store/auth/**                              ← nobody
frontend/src/features/{auth,employee,organization,organization-type}/**  ← nobody
frontend/src/shared/components/**                       ← reuse only; do not modify
frontend/src/shared/hooks/**                            ← reuse only; do not modify
```
If a shared component genuinely cannot express what you need, **do not fork or edit it** — build a workflow-local component and note it in your final report.

## DEPENDENCIES — and how to not wait
**Do not wait for any backend.** Contract §5 fully specifies every request and response.

Mock strategy (contract §14):
1. Write `services/workflow.api.ts` and `services/notification.api.ts` against contract §5 exactly, using `baseApiService` + `ApiEndpoints`.
2. Add `services/__mocks__/workflow.fixtures.ts` returning objects that match contract §5.6 **field-for-field**. A fixture with different field names is worse than no fixture — it produces UI that compiles now and breaks at integration.
3. Gate with **one** flag (e.g. `const USE_MOCK_WORKFLOW_API = true` in a single module). One switch, one line to flip.
4. Fake sockets by calling the same invalidation handler the real client will use — so the real socket needs no new wiring.
5. **At integration: flip the flag, delete the fixtures, and say so in your final report.** Shipping the mock path is a defect.

---

## TASKS

### T1 — Feature scaffolding + API layer
```
frontend/src/features/workflow/
├── pages/
│   ├── WorkflowListPage.tsx
│   ├── WorkflowCreatePage.tsx
│   ├── WorkflowEditPage.tsx
│   ├── WorkflowRequestSubmitPage.tsx
│   ├── MyRequestsPage.tsx
│   ├── ReviewerInboxPage.tsx
│   └── WorkflowRequestDetailPage.tsx
├── components/
│   ├── FormSchemaBuilder.tsx          ← authors form_schema.fields[]
│   ├── DynamicFormRenderer.tsx        ← renders form_schema → inputs
│   ├── WorkflowStepBuilder.tsx        ← authors the ordered step chain
│   ├── WorkflowFlow.tsx               ← React Flow canvas
│   ├── WorkflowStepNode.tsx           ← custom node
│   ├── WorkflowHistoryTimeline.tsx
│   ├── WorkflowActionBar.tsx          ← approve/feedback/reject/cancel/resubmit
│   └── WorkflowStatusBadge.tsx
├── hooks/                             ← one file per query/mutation, like organization-type
├── services/workflow.api.ts
├── schemas/workflow.schema.ts         ← Zod for builder + dynamic form
├── types/workflow.types.ts            ← mirror contract §1 + §5.6 exactly
└── utils/
    ├── query-keys.ts                  ← EXACTLY contract §13's keys
    ├── workflow-flow-layout.ts        ← steps → nodes/edges + dagre
    └── build-workflow-payload.ts

frontend/src/features/notification/
├── components/{NotificationBell,NotificationDropdown,NotificationItem}.tsx
├── hooks/{useNotificationsQuery,useMarkNotificationReadMutation,useMarkAllNotificationsReadMutation}.ts
├── services/notification.api.ts
├── types/notification.types.ts
└── utils/query-keys.ts
```

Add to `api-endpoints.ts` following the existing zero/one-arg function style with `encodeURIComponent` on every id:
```ts
workflows: {
  list: () => '/api/workflows',
  detail: (id: string) => `/api/workflows/${encodeURIComponent(id)}`,
  create: () => '/api/workflows',
  update: (id: string) => `/api/workflows/${encodeURIComponent(id)}`,
  replaceSteps: (id: string) => `/api/workflows/${encodeURIComponent(id)}/steps`,
},
workflowRequests: {
  list: () => '/api/workflow-requests',
  detail: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}`,
  histories: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/histories`,
  create: () => '/api/workflow-requests',
  approve: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/approve`,
  feedback: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/feedback`,
  reject: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/reject`,
  cancel: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/cancel`,
  resubmit: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/resubmit`,
},
notifications: {
  list: () => '/api/notifications',
  read: (id: string) => `/api/notifications/${encodeURIComponent(id)}/read`,
  readAll: () => '/api/notifications/read-all',
},
```

### T2 — Routes and state
Add the seven routes from contract §12 to `app.routes.tsx`, inside `AuthGuard` → `AppLayout`, with `handle({ title, sidebarActiveKey, breadcrumb })` following the existing pattern (hoist breadcrumb roots as consts; the last crumb has no `to`).

Two things that will bite you:
- **`RouteHandle.sidebarActiveKey` is a closed literal union**, not `string`. Widen it in `route.types.ts` with `'workflow.list' | 'workflow.create' | 'workflow.requests' | 'workflow.inbox'` or routing will not type-check.
- **Declare `/workflow-requests/inbox` and `/workflow-requests/new` BEFORE `/workflow-requests/:id`**, or React Router captures the literal segments as an `:id`.

State: **no Redux slice unless genuinely required.** Unread count comes from `meta.unreadCount` on `GET /api/notifications` via TanStack Query (contract §13) — putting it in Redux would create a second source of truth that socket invalidation would not refresh. Only add a slice if you need a cross-route selection handoff like the existing bulk-edit pages; if you do, copy `store/organizationTypeSelection/` exactly and register it in `store/index.ts`.

Query keys must be **exactly** contract §13's — Agent 2's socket events invalidate by those keys.

### T3 — Workflow list + definition builder
- **List**: `useListQueryState` + `SearchAndFilterBar` (with limit selector) + `SortableTableHeader` + `Pagination` + `PageStates`. Status filter via the custom filter slot. Loading/empty rows inside `<tbody>` with the correct `colSpan`. Follow `OrganizationTypeListPage`.
- **Create/Edit**: RHF + Zod + two-phase confirm submit (`ConfirmDialog` + `FullPageLoadingOverlay`), exactly as `OrganizationTypeCreatePage`.
- **`FormSchemaBuilder`**: `useFieldArray` over `formSchema.fields`. Per row: `key`, `label`, `type` (six types from contract §1.5), `required`. When `type === 'select'`, reveal a nested `useFieldArray` for `options[]` (`label`/`value`). Zod must enforce contract §3.1: `key` pattern `^[a-zA-Z][a-zA-Z0-9_]*$`, unique keys, non-empty labels, `options` non-empty for `select` and absent otherwise.
- **`WorkflowStepBuilder`**: `useFieldArray` over the ordered chain. Per row: `name` + `organizationTypeId` (a `react-select` or `SelectField` fed by `GET /api/organization-types` — **fetched once**, not per row). Reorder/add/remove; min 1, max 20. **The client never sends `parentId`** — array order is the chain (contract §5.4).
- Save steps via `POST /api/workflows/:id/steps` (full replace). Handle `409 WORKFLOW_HAS_ACTIVE_REQUESTS` with a clear message: the chain cannot be rewired while requests are in flight.

### T4 — React Flow visualisation
`utils/workflow-flow-layout.ts`, mirroring `organization-layout.ts`:
```ts
buildWorkflowStepNodes(steps): WorkflowFlowNode[]
buildWorkflowStepEdges(steps): Edge[]        // derived from parentId
layoutWorkflowStepNodes(nodes, edges): WorkflowFlowNode[]   // dagre, rankdir 'TB'
```
- Edges come from `parentId` only.
- Dagre: `graph.setGraph({ rankdir: 'TB', nodesep: 48, ranksep: 80 })`; remember dagre reports **centre** coordinates while React Flow positions by **top-left** — subtract half width/height, exactly as the org chart does.
- `nodeTypes` hoisted at module scope (a new object identity each render remounts every node).
- Import `'@xyflow/react/dist/style.css'`.
- Node shows step `name` + the resolved organization-type name; `WorkflowStepNode` handles are non-connectable.
- **Persist nothing** — no `x`/`y` in any payload (contract §2.2). Positions are recomputed every render.
- `@xyflow/react` and `@dagrejs/dagre` are **already installed** — do not add or bump them.

### T5 — Submit + request screens
- **Submit**: pick an `ACTIVE` workflow → `DynamicFormRenderer` builds inputs and a runtime Zod schema from `formSchema` → `POST /api/workflow-requests` with `{ workflowId, formData }`.
  Type mapping per contract §3.2: `text`/`textarea` → string; `number` → **number**, not numeric string; `date` → `YYYY-MM-DD`; `select` → one of `options[].value`; `checkbox` → boolean.
  Server field errors arrive as `formData.<key>` — map them with the existing `useApplyApiFieldErrors`, using its `mapFieldPath` option if your form nests differently.
- **My Requests** (`scope=mine`) and **Reviewer Inbox** (`scope=inbox`): list pages following the same shared-primitive pattern.
- **Detail**: form values (read-only), `WorkflowHistoryTimeline` (ascending, showing actor / step / action / comment / timestamp), and `WorkflowActionBar`.

### T6 — Action UI
Buttons are driven **entirely by `permissions`** from the response (contract §5.6) — never by inferring from status or comparing ids client-side. FEEDBACK and REJECT require a comment (`ConfirmDialog` with a textarea; contract §5.2).

**Always send the `revision` you last read** with every action (contract §8.2).

`409 WORKFLOW_REQUEST_STALE` handling — this is the concurrency path and must feel correct, not broken:
```
invalidate ['workflow-requests', id] and its histories
→ refetch
→ show a non-alarming message: "This request was just updated by someone else. Showing the latest state."
```
Do not simply surface a raw error. Note that `api-client.ts`'s response interceptor **already shows a toast for every non-401 failure**, so do not add a second toast for the same rejection.

### T7 — Header Notification Bell ⚠️ HIGHEST-RISK EDIT
In `frontend/src/layouts/AppLayout.tsx`, `Navbar`, `UserMenu`, and `Sidebar` are all defined **in this one file**.

**Add `<NotificationBell />` inside `Navbar`, immediately to the left of `<UserMenu />`:**
```tsx
<div className="flex items-center gap-3">
  <NotificationBell />
  <UserMenu />
</div>
```

**ABSOLUTE BOUNDARY (brief §17, §25, §43).** You must not modify, refactor, restyle, or "tidy":
- the `UserMenu` function — any part of it,
- the Change Password link,
- the Logout button or `handleLogout`,
- the account dropdown markup or behaviour.

Your diff in this file must contain only: the `NotificationBell` import, the wrapper/placement shown above, and the new `NAV_GROUPS` entry. If your diff touches `UserMenu`, revert it.

Also add a `Workflow` nav group to `NAV_GROUPS` (Workflows / My Requests / Inbox) matching the existing group shape, and widen the `NavItem['key']` union accordingly.

### T8 — Notification UI
- **`NotificationBell`**: MUI icon (`@mui/icons-material` is already installed — **no new icon library**). Badge renders **only when `unreadCount > 0`**.
- **`NotificationDropdown`**: recent N (default 10) from `GET /api/notifications`. Unread visually distinct from read. Relative timestamps. Empty state. "View All" link.
- **Click a notification** (contract §12, brief §20): `PATCH /api/notifications/:id/read` → close dropdown → `navigate('/workflow-requests/' + referenceId)`. Guard a null `referenceId` (mark read, close, do not navigate).
- **Mark all read** action.
- Invalidate `['notifications']` after every mutation so the badge updates.

### T9 — Socket client
`features/workflow/hooks/useWorkflowSocket.ts` + a provider mounted inside `AuthGuard` (it needs an authenticated token).

- `socket.io-client`, namespace `/ws`, token in the handshake: `io(url + '/ws', { auth: { token } })`.
- On `workflow-request:{id}` pages: emit `workflow-request:subscribe` on mount, `:unsubscribe` on unmount.
- **Every handler does exactly one thing: `queryClient.invalidateQueries(...)`** per contract §13's map.
- **Never** merge a socket payload into cache or render from it (contract §9.4). Payloads carry ids only; treating them as data means a dropped or out-of-order event shows wrong data instead of merely stale data.
- On reconnect, invalidate `['workflow-requests']` and `['notifications']` to recover anything missed while disconnected.
- Disconnect must degrade gracefully — REST keeps working; no error UI for a dropped socket.
- Add `socket.io-client` to `package.json`. That is the **only** dependency you add.

### T10 — Specs
`docs/07-frontend/pages/workflow-*.md` and `notification-*.md`; update `docs/07-frontend/architecture.md` (feature layout, state ownership), `api-client.md` (new endpoint namespaces, new error mappings), `react-route.md` (new routes + the widened `sidebarActiveKey`). Follow the existing format.

---

## IMPLEMENTATION RULES
1. **JSX one-line attributes** — every element's attributes on a single line, however long, for every element and component (`AGENTS.md` Frontend Rules). This is enforced project-wide.
2. **TanStack Query owns server state**; Redux only for genuine cross-route client state; local state for UI.
3. **Never hard-code `/api/...`** — always `ApiEndpoints`.
4. **Never call Axios directly** from a component; go through the service objects.
5. **Reuse shared components/hooks; never modify them.**
6. **Use `useListQueryState`** for every list page — do not recreate its state/handlers.
7. **Socket is a hint, REST is the truth.** Handlers invalidate; they never write cache.
8. **Buttons follow `permissions`** from the server; hiding a button is never the security boundary.
9. **Persist no React Flow coordinates.**
10. **Do not touch `UserMenu` / Change Password / Logout.**
11. **Do not write any test file and do not run tests** (`AGENTS.md`, brief §43). `npm run build` is fine and expected.
12. **Do not change any contract value.** Missing something? Report and ask.

## DEFINITION OF DONE
- All seven routes render, ordered so literal segments precede `:id`; `sidebarActiveKey` union widened.
- Workflow list has search/sort/pagination/status filter via shared primitives.
- Form-schema builder authors all six field types, with `select` options, enforcing contract §3.1.
- Step builder authors the ordered chain and never sends `parentId`.
- React Flow renders the chain with dagre layout, edges derived from `parentId`, nothing persisted.
- Dynamic form renders all six types and maps `formData.<key>` server errors to fields.
- My Requests, Reviewer Inbox, and Detail (with timeline) work.
- All five actions callable, gated by `permissions`, sending `revision`; `409` stale is handled by refetch + a calm message.
- Bell sits beside the account menu; badge only when `unreadCount > 0`; dropdown distinguishes read/unread; click marks read, closes, and navigates to the request.
- Socket connects with handshake auth, subscribes/unsubscribes per request page, and only ever invalidates.
- `UserMenu` / Change Password / Logout diff is **empty**.
- Only `socket.io-client` added to `package.json`.
- `npm run build` passes (the pre-existing Vite large-chunk warning is expected).
- Mock flag flipped off and fixtures deleted at integration.
- Zero test files created; zero tests run.
- No file from the forbidden list modified.
- Specs written.

## FINAL REPORT FORMAT
```
## Agent 3 — Final Report

### Delivered
- <screen / component> → <file path>

### AppLayout.tsx diff (state explicitly)
- Lines added: <summary>
- UserMenu / Change Password / Logout touched: NO   ← must be NO
- NAV_GROUPS entries added:

### Routes
- Added: <list>
- sidebarActiveKey union widened to:
- Literal-before-:id ordering confirmed: yes/no

### React Flow
- Layout util: <path>
- Edges derived from: parentId
- Coordinates persisted: NO   ← must be NO

### Socket
- Client: <path>
- Rooms subscribed:
- Handlers only invalidate: yes/no
- Reconnect recovery: <detail>

### Mocks
- Flag location: <path:line>
- Fixtures: <paths>
- Flag flipped off / fixtures deleted: yes/no   ← must be yes at integration

### Dependencies added
- <should be only socket.io-client>

### Contract deviations
- <none, or exact item + why>

### Verification
- npm run build: <result>
- Tests: not created, not run (out of scope)

### Open questions / blockers
```
