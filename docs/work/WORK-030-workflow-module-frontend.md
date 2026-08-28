---
id: WORK-030
type: workflow
module: workflow
status: draft
depends_on:
  - WORK-027
---

# WORK-030: Workflow Module Frontend, React Flow, Notification UI (Agent 3)

## Work Status
`APPROVED` - ready for a frontend AI agent to implement after reading the required specs. Per project Planning Rules, this is contract-approved, not code-authorized — implementation still requires a separate, explicit user go-ahead in the implementing session before any file is written.

## Summary
Implement the entire workflow user interface: definition list/create/edit with a dynamic form-schema builder and step-chain builder, React Flow visualisation of the chain, employee submit, My Requests, Reviewer Inbox, request detail with history timeline and action buttons, a socket client that invalidates TanStack Query caches, and the header Notification Bell with unread badge, dropdown, mark-read, and navigation.

This work can run in parallel with `WORK-028` and `WORK-029` — see Dependencies for the mock strategy that removes the wait.

## Scope
In scope:
- Seven routes: `/workflows`, `/workflows/create`, `/workflows/:id/edit`, `/workflow-requests/new`, `/workflow-requests`, `/workflow-requests/inbox`, `/workflow-requests/:id`.
- `FormSchemaBuilder` (authors `form_schema.fields[]` for all six field types, with `select` options), `DynamicFormRenderer` (renders schema → inputs + runtime Zod), `WorkflowStepBuilder` (ordered chain, never sends `parentId`).
- React Flow visualisation: steps → nodes, `parentId` → edges, dagre layout; nothing persisted.
- List pages using the shared primitives (`useListQueryState`, `SearchAndFilterBar`, `SortableTableHeader`, `Pagination`, `PageStates`).
- Request detail with history timeline and an action bar gated by the server-provided `permissions`, sending `revision` with every action and handling `409` stale by refetch.
- Socket client (`socket.io-client`, `/ws`, handshake JWT) whose handlers only ever invalidate query caches.
- `NotificationBell` + dropdown in the existing header, beside the account menu.
- New `workflows` / `workflowRequests` / `notifications` namespaces in `api-endpoints.ts`; widened `RouteHandle.sidebarActiveKey`; new `Workflow` sidebar nav group.
- Frontend specs under `docs/07-frontend/`.

Out of scope:
- All backend work (`WORK-028`, `WORK-029`).
- Automated tests of any kind.
- **Any change to `UserMenu`, Change Password, or Logout** — these already exist and must remain byte-for-byte unchanged. The Bell is added *beside* them.
- Modifying any shared component or hook; they are reuse-only.

## Dependencies
Executable agent prompt (read this first, it is the detailed task definition):
- `docs/09-workflow/plans/workflow-module/agent-3-prompt.md`

Required specs to read before coding:
- `AGENTS.md`
- `docs/09-workflow/plans/workflow-module/workflow-contract.md` — binding contract
- `docs/09-workflow/plans/workflow-module/workflow-master-spec.md`
- `docs/00-project/*`, `docs/01-business/*`, `docs/02-solution/*`, `docs/03-technology/*`, `docs/05-ui-ux/*`, `docs/06-api/*`, `docs/07-frontend/*`
- `docs/work/WORK-027-workflow-module-contract.md`

Reference patterns to copy: `frontend/src/features/organization-type/` (feature layout, query/mutation hooks, service object), `OrganizationTypeCreatePage.tsx` (RHF + Zod + `useFieldArray` + two-phase confirm submit), `frontend/src/features/organization/utils/organization-layout.ts` + `OrganizationFlow.tsx` + `OrganizationNode.tsx` (React Flow + dagre — mirror it, do not reinvent).

**Do not wait for any backend.** Write the API services against the contract exactly, then feed them from a fixture module behind a single flag. Fixtures must match the contract's response shapes field-for-field — a fixture with different field names produces UI that compiles now and breaks at integration. Fake sockets by calling the same invalidation handler the real client will use. At integration, flip the flag off, delete the fixtures, and say so in the final report.

## Implementation Notes
- **JSX one-line attributes** for every element and component, however long — enforced project-wide by `AGENTS.md`.
- TanStack Query owns server state; unread count comes from `meta.unreadCount`, **not** Redux (Redux would be a second source of truth that socket invalidation would not refresh). Add a Redux slice only for a genuine cross-route selection handoff.
- Query keys must match the contract exactly — `WORK-029`'s socket events invalidate by those keys.
- Never hard-code `/api/...`; always `ApiEndpoints`. Never call Axios from a component.
- `RouteHandle.sidebarActiveKey` is a **closed literal union** and must be widened, or routing will not type-check.
- Declare `/workflow-requests/inbox` and `/workflow-requests/new` **before** `/workflow-requests/:id`, or React Router captures the literal segments as an `:id`.
- Socket handlers do exactly one thing: `invalidateQueries`. Never merge a payload into cache or render from it — payloads carry ids only, so treating them as data turns a dropped or out-of-order event into wrong data instead of merely stale data. Invalidate on reconnect to recover anything missed.
- Action buttons follow the server's `permissions` object; hiding a button is never the security boundary.
- Persist no React Flow coordinates. Hoist `nodeTypes` at module scope (a new object identity each render remounts every node). Remember dagre reports centre coordinates while React Flow positions by top-left.
- `api-client.ts`'s response interceptor already toasts every non-401 failure — do not add a second toast for the same rejection.
- Only new dependency: `socket.io-client`. React Flow, dagre, RHF, Zod, MUI icons, and react-select are already installed; do not re-add or bump them.

## Test Plan
- Do not create test files and do not run tests — out of scope per `AGENTS.md` Testing Rules and the task brief.
- Permitted verification: `npm run build`, plus manual walkthrough of the screens.

## Test Result
NOT RUN - implementation not started.

## Risks / Ambiguities
- **`frontend/src/layouts/AppLayout.tsx` is the highest-blast-radius edit in the module**: `Navbar`, `UserMenu`, and `Sidebar` are all defined in that one file. The diff there must contain only the `NotificationBell` import, its placement beside `UserMenu`, and the `NAV_GROUPS` addition. Any change inside `UserMenu`, the Change Password link, or `handleLogout` must be reverted.
- Shipping the mock path is a defect. The flag must be off and fixtures deleted at integration.
- A dropped socket must degrade gracefully — REST keeps working, no error UI.
