# Frontend: Organization Chart screen (React Flow, stage-only, no API)

## Context
Task source: `docs/09-workflow/daily-tasks/fe-2026-08-23.md` (frontend-only; full spec — layouts, algorithms, acceptance criteria — already lives there, referenced by section number below rather than duplicated). Goal: an `/organizations` screen rendering the org hierarchy as a React Flow tree, backed entirely by local React state ("Frontend Stage"), no real API calls — just abstractions/TODOs for later integration.

## Decisions confirmed with the user (task file had gaps/contradictions — resolved before planning further)
1. **Body-click opens a full Edit modal**, not a read-only Detail modal — the task file contradicts itself (§19-20 & §33 acceptance criteria say "Detail Modal, view-only"; §32 explicitly excludes "Edit Organization"; but the unnumbered "Node Actions" section at the end describes a full edit form). User chose the fuller Edit-modal version. Consequence: `OrganizationStage` needs an `isActive?: boolean` field (defaults `true`) to back the Edit modal's "Status" dropdown — not in the original TS interface in §3, added deliberately to reconcile the contradiction. `manager` in the Edit modal is a **plain text input for the name only** (not a dropdown) — no manager directory/list exists anywhere in this frontend-only scope, so a picker can't be built; Create modal still has no manager field at all (matches §13).
2. **UI library: MUI** (`@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`). Neither MUI nor Ant Design nor React Flow nor dagre are installed yet — all new dependencies. React Flow ships today as **`@xyflow/react`** (the old `reactflow` package name is deprecated) — using the current one.
3. **No TypeScript strict-mode work** — user said not to bother with it (neither flipping `tsconfig.app.json`'s `strict` nor extra self-imposed rigor). Write the new code in the same style already used by `features/employee/*`.
4. Since MUI is being introduced for the first time in this codebase, scope its `ThemeProvider`/`CssBaseline` to the Organization page tree only — do not touch the global `App.tsx` shell or other features.

## Reused conventions (from exploring `frontend/src`)
- Feature-module shape: `pages/ components/ hooks/ services/ types/ utils/` — mirror `features/employee/*` (see that folder for the template).
- Routing: single file `src/routes/app.routes.tsx` (`createBrowserRouter`) — add one route here, do **not** create a feature-specific route file (`docs/07-frontend/architecture.md`). Each route carries a `handle: handle({...})`; extend `RouteHandle`'s `sidebarActiveKey` union (in `route.types.ts`) with a new key.
- Sidebar: `Sidebar` is defined inline in `src/layouts/AppLayout.tsx` as a **flat** `NAV_ITEMS` array (one "Employee" section, 2 items). Task §33 asks for a nested "Organization" parent with child item(s) — restructure `NAV_ITEMS` into `NAV_GROUPS: { label, items: {key,label,to}[] }[]`, converting the existing Employee entries into the first group unchanged, and adding an "Organization" group with one item for now ("Organization Chart" → `/organizations`) — extensible later, since only one screen exists today.
- API layer: mirror `features/employee/services/employee.api.ts`'s shape (a plain object of typed methods) for the new `organization.api.ts`, but every method body is a stub (`// TODO: integrate real endpoint`) per the task — not wired to `baseApiService`/`ApiEndpoints` yet. Keep the commented `useQuery`/`useMutation` example from task §26 as a header comment there, ready to uncomment later.
- State management: local `useState` for the stage is consistent with `docs/07-frontend/state-management.md` (Redux is reserved for app-wide client state only) — not a deviation.

## New files

### `frontend/src/features/organization/`
```
types/organization.types.ts        - OrganizationType enum, OrganizationStage, CreateOrganizationFormItem, EditOrganizationFormValues
utils/organization-tree.ts         - generateNextUiId, findDescendantUiIds, removeOrganizationTree, findOrganization, countChildren, wouldCreateCycle (stub for future Move, per Note 4 in the task)
utils/organization-layout.ts       - buildOrganizationNodes, buildOrganizationEdges, layoutOrganizationNodes (dagre, direction TB)
hooks/useOrganizationStage.ts      - owns the useState<OrganizationStage[]>([]) stage; exposes addOrganizations(items, parentUiId), removeOrganizationTree(uiId), updateOrganization(uiId, values), getOrganization(uiId); all immutable, delegates the pure logic to utils/organization-tree.ts
hooks/useOrganizationFlow.ts       - organizations[] -> { nodes, edges } via useMemo, debounced 200ms (see shared hook below) before feeding the dagre layout pass
components/OrganizationFlow.tsx    - <ReactFlow> wrapper with every interaction disabled (nodesDraggable/nodesConnectable/panOnDrag/panOnScroll/zoomOnScroll/zoomOnPinch/zoomOnDoubleClick = false, no fitView, no reactFlowInstance.fitView() call) - per task §9
components/OrganizationNode.tsx    - custom node: [+] / name+icon / [x] header, type+manager body; both buttons call event.stopPropagation() before firing onAdd(uiId)/onDelete(uiId); body click (not caught by the buttons) fires onOpenEdit(uiId)
components/OrganizationToolbar.tsx - "Organization" title + "[+ Add Organization]" button (opens Create modal with parentUiId=null)
components/CreateOrganizationModal.tsx - MUI Dialog; readonly parent chip when parentUiId != null; editable rows table (code/name/type/delete-row) + "+ Add Row"; validates per task §16 (code/name/type required, code unique within the *current form rows*, at least 1 row) - note: uniqueness is checked against the form's own rows, not yet against `organizations[]`'s existing codes, since the task's §16 validation list doesn't ask for cross-stage code uniqueness (flagging this scope reading explicitly, see "Noted, not building" below)
components/EditOrganizationModal.tsx   - full edit form per the final "Edit Organization Modal" mockup: Code*, Name*, Type*, Parent (readonly, resolved from parentUiId), Manager (text input), Status (Active/Inactive -> isActive), Description; Save calls updateOrganization; does not touch uiId/parentUiId (renamed from the task's §27 "OrganizationDetailModal.tsx" to accurately reflect decision #1 above)
pages/OrganizationPage.tsx         - composes everything: empty state vs OrganizationFlow, local modal state ({type:'create'|'edit', parentUiId?, targetUiId?} | null), wraps its subtree in MUI's <ThemeProvider>/<CssBaseline> (scoped here only, per decision #4)
services/organization.api.ts       - stub object (getTree/create/update/delete), TODO-commented, matching employeeApiService's shape
```

### `frontend/src/shared/hooks/useDebouncedValue.ts`
Small generic hook (`useDebouncedValue<T>(value: T, delayMs: number): T`) — reused by `useOrganizationFlow` for the 200ms debounce task §35 asks for around layout recalculation. Placed in `shared/hooks/` since it's generic, not Organization-specific.

## Routing + Sidebar changes
- `src/routes/route.types.ts`: add `'organization.chart'` to the `sidebarActiveKey` union.
- `src/routes/app.routes.tsx`: add `{ path: 'organizations', element: <OrganizationPage />, handle: handle({ title: 'Organization', sidebarActiveKey: 'organization.chart' }) }` alongside the existing `employees` routes (same `AuthGuard` → `AppLayout` branch).
- `src/layouts/AppLayout.tsx`: restructure the hardcoded `NAV_ITEMS` into grouped sections as described above; render a section header per group (matching the existing "Employee" header style) followed by its items.

## Key algorithms (already fully specified in the task file — implementing as written)
- `uiId` generation: task §4 (`max(...allUiIds)+1`, or `1` if empty) — implemented once in `generateNextUiId`, used by both `useOrganizationStage.addOrganizations` and the modal's row-add flow (task §16's `maxUiId` example uses the same rule against the *existing* stage, not the modal's local rows).
- Delete-with-descendants: task §17/§18 algorithm — `findDescendantUiIds` (recursive) + `removeOrganizationTree` (filters target ∪ descendants out, immutable).
- Tree → React Flow: task §23/§24 (`organization-${uiId}` node ids, edges from `parentUiId`), then `dagre` top-to-bottom layout (task §25).

## Noted, not building (flagging per Debugging Rules — surfacing, not silently deciding)
- Task §16 lists "Code không được trùng trong stage" as a validation rule, but the worked example only shows checking duplicates *within the form's own rows* before submit. I'm implementing in-form uniqueness (simple, matches the example) and *not* cross-checking against already-existing `organizations[]` codes — say so if you want the stricter check too.
- Cycle-prevention (`wouldCreateCycle`) is written as an inert helper only, per task Note 4 ("no Move action in this task, but helper should be designed for it later") — it is not wired into any current user flow since there's nothing that can move a node yet.
- `manager` has no backing data source anywhere in this frontend-only task — Edit modal treats it as free text for the name; `id`/`avatar` on `OrganizationStage.manager` stay unset from this UI.

## Out of scope (per task §32 — not touching)
Backend/NestJS/Prisma/DB, auth/authorization, drag & drop, move, zoom/pan/fit-view, real API calls, persistence.

## Verification
- `npm run build` (or `tsc -b` / `vite build`) in `frontend/` — 0 new type errors.
- Manually exercise: empty state → Add Organization (root) → click `[+]` on the new node → add 2-3 children → click node body → Edit modal opens prefilled, change fields, Save reflects in the node → click `[x]` on a node with children → node + descendants disappear together → confirm tree re-layouts (dagre, top-to-bottom) after each mutation.
- Confirm React Flow canvas cannot be panned/zoomed/dragged and nodes can't be dragged (per task §9), and that clicking `[+]`/`[x]` never also opens the Edit modal (`stopPropagation` working).
