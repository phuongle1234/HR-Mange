---
id: FRONTEND-ORGANIZATION-CHART
type: frontend
module: organization
status: draft
depends_on:
  - FRONTEND-REACT-ROUTE
  - FRONTEND-AUTH-PROVIDER
---

# Organization Chart

## Purpose
Define the React page-level behavior for the Organization org-chart screen. This is a **frontend-only** feature (source: `docs/09-workflow/daily-tasks/fe-2026-08-23.md`, plan: `docs/09-workflow/plans/organization-frontend-chart.md`) — there is no backend API call anywhere in this page; all data lives in local React state ("Frontend Stage"). There is no `UI-ORGANIZATION`/`API-ORGANIZATION-*` spec this depends on for that reason (unlike `FRONTEND-EMPLOYEE-LIST`).

## Route Reference
```text
/organizations -> OrganizationPage
```
Route-level decisions (see `docs/07-frontend/react-route.md`):
- Layout: `AppLayout`, gated by `AuthGuard` (same as `/employees`).
- Sidebar: a second nav group "Organization" (single item "Organization Chart") alongside the existing "Employee" group — `AppLayout`'s `Sidebar` was restructured from a flat item list to grouped sections to support this.
- Navbar title: `Organization`.

## Page Component
```text
src/features/organization/pages/OrganizationPage.tsx
```

## Feature Module Layout
```text
features/organization/
├── types/organization.types.ts        - OrganizationType (const-tuple union, not a TS enum - erasableSyntaxOnly), OrganizationStage, OrganizationManager
├── schemas/organization.schemas.ts     - zod schemas + form-value types for both modals (CreateOrganizationFormValues, EditOrganizationFormValues)
├── utils/organization-tree.ts          - generateNextUiId, findDescendantUiIds, removeOrganizationTree, findOrganization, countChildren, wouldCreateCycle (unused stub, for a future Move feature)
├── utils/organization-layout.ts        - buildOrganizationNodes, buildOrganizationEdges, layoutOrganizationNodes (dagre, top-to-bottom)
├── hooks/useOrganizationStage.ts       - owns the Frontend Stage (useState<OrganizationStage[]>([]))
├── hooks/useOrganizationFlow.ts        - stage -> { nodes, edges }, debounced 200ms before each dagre layout pass
├── components/organization-actions.context.ts - lets OrganizationNode fire add/delete/edit callbacks without threading them through the pure node data
├── components/OrganizationNode.tsx     - custom React Flow node ([+] / name / [x] header, type + manager body)
├── components/OrganizationFlow.tsx     - <ReactFlow> wrapper (see "React Flow Configuration" below)
├── components/OrganizationToolbar.tsx  - "+ Add Organization" button only (no in-content title - the Navbar already shows "Organization")
├── components/CreateOrganizationModal.tsx - multi-row create form (react-hook-form `useFieldArray` + zod)
├── components/EditOrganizationModal.tsx   - single-record edit form
└── services/organization.api.ts        - stub object (getTree/create/update/delete), every method throws "not implemented" - TODO-commented for later API integration
```

## Data Model
```ts
interface OrganizationStage {
  uiId: number;           // frontend-generated, never a UUID, never the DB id
  parentUiId: number | null;
  id?: number;             // DB id, unset until a real API exists
  code: string;
  name: string;
  type: OrganizationType;  // COMPANY | BRANCH | DIVISION | DEPARTMENT | TEAM
  description?: string;
  manager?: { id?: number; name: string; avatar?: string };
  isActive?: boolean;       // added beyond the original task spec - backs the Edit modal's Status field
}
```
- `uiId` generation: `organizations.length === 0 ? 1 : Math.max(...uiIds) + 1` for a single add; for a multi-row Create submit, `Math.max(0, ...uiIds) + rowIndex + 1` so every row in the batch gets a distinct id in one pass.
- Deleting a node removes it and every descendant (`removeOrganizationTree` = target ∪ `findDescendantUiIds`, immutable) — no orphaned nodes.
- `manager` has no backing directory anywhere in this frontend-only scope — the Edit modal's Manager field is a plain text input for the name only; there is no picker, and Create has no manager field at all.

## React Flow Configuration
Current `OrganizationFlow.tsx` props on `<ReactFlow>`:
| Prop | Value | Effect |
| --- | --- | --- |
| `nodesConnectable` | `false` | User cannot draw new edges. |
| `panOnScroll` | `false` | Scrolling the mouse wheel over the canvas does not pan it. |
| `zoomOnDoubleClick` | `false` | Double-click does not zoom. |
| `nodesDraggable` | *(unset → defaults `true`)* | **Nodes can be dragged.** |
| `panOnDrag` | *(unset → defaults `true`)* | **Canvas can be panned by click-dragging.** |
| `zoomOnScroll` | *(unset → defaults `true`)* | **Mouse-wheel zoom is active.** |
| `zoomOnPinch` | *(unset → defaults `true`)* | **Pinch-to-zoom is active.** |
| `fitView` | not passed | Layout is positioned once by `layoutOrganizationNodes` (dagre); the view never auto-fits. |

This diverges from the original task brief (`fe-2026-08-23.md` §9 listed all seven props above as required `false`, and its Acceptance Criteria included "Không Zoom" / "Không Pan" / "Không Drag Node"). The four unset props were removed directly in code after the initial implementation; per the user's decision this is accepted as the current intended behavior, not a defect to fix — recorded here so the spec matches what actually ships instead of the original brief.

## Modals
- **Create** (`CreateOrganizationModal`): multi-row table (Code/Name/Type/remove-row), "+ Add Row", parent shown read-only (as a chip) when opened from a node's `[+]`. Validation (zod): code/name/type required per row, code unique among the form's own rows (not cross-checked against already-existing stage codes), at least 1 row.
- **Edit** (`EditOrganizationModal`): opened by clicking a node's body. Full form — Code, Name, Type, Parent (read-only), Manager (free text), Status (Active/Inactive ↔ `isActive`), Description. Does not touch `uiId`/`parentUiId`.
- Both `[+]`/`[x]` buttons on a node call `event.stopPropagation()` so they never also trigger the body-click (Edit) handler.

## Navbar User Menu
`AppLayout`'s `Navbar` now always renders `<UserMenu />` (the avatar + dropdown with Change Password/Logout), regardless of the route's `handle.showUserMenu` value — previously only `/employees` (`showUserMenu: true`) showed the dropdown, and every other route showed a plain name span instead. This change was made directly in `AppLayout.tsx` while building this page (so `/organizations` also gets the dropdown) and now applies to every route using `AppLayout`, not just this one. `handle.showUserMenu` in `route.types.ts`/`app.routes.tsx` is no longer read anywhere — it has no effect and is a candidate for removal in a future cleanup.

## Known Gaps (carried over from the implementation plan, still open)
- No real API integration yet (`services/organization.api.ts` stubs only) — see that file's header comment for the intended `useQuery`/`useMutation` wiring.
- `createMany`/bulk endpoints on the backend (`backend/src/modules/organization`) are not connected to this screen at all.

## Pending Decisions
- Whether the four now-permissive React Flow interactions (drag node, pan, wheel zoom, pinch zoom) are the final intended UX, or should be re-disabled — currently left as the user's in-code decision (see "React Flow Configuration" above).
- Whether `/change-password`'s move to an ungated public route (see `docs/07-frontend/pages/change-password.md`) is final.
