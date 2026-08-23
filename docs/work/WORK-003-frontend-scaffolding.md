---
id: WORK-003
type: workflow
module: global
status: draft
depends_on:
  - TECH-FRONTEND
  - SOLUTION-FRONTEND-ARCHITECTURE
  - 07-FRONTEND-ARCHITECTURE
  - 07-FRONTEND-API-CLIENT
  - 07-FRONTEND-STATE-MANAGEMENT
  - 07-FRONTEND-REACT-ROUTE
---

# WORK-003: Frontend Project Scaffolding

## Work Status
`IMPLEMENTED` — `frontend/` scaffolded (Vite + React + TypeScript + Tailwind v4), provider tree, Redux `authSlice`, centralized Axios client/`ApiEndpoints`/error normalization, and the empty central route table are all in place. No `PermissionProvider`/`permissionSlice` were built — `WORK-000` decision #2 removed the permission model before this item was implemented, so those files never existed rather than being stubbed then deleted.

## Summary
Create the empty React project skeleton so the auth/employee page work items (`WORK-012` onward) have a place to land: build tooling, Tailwind, the provider tree, the centralized Axios client, and the empty route table — no pages yet.

## Scope
In scope:
- `frontend/` React + TypeScript project (Vite, per `TECH-FRONTEND`'s stated stack) with Tailwind configured for the "Green Momentum" theme tokens from `05-ui-ux/design-system.md`.
- Folder structure per `07-FRONTEND-ARCHITECTURE`: `src/app`, `src/routes`, `src/layouts`, `src/providers`, `src/store`, `src/shared`, `src/features/{auth,employee}`.
- Provider tree wiring in the fixed order: `ReduxProvider → QueryProvider → AuthProvider → PermissionProvider → RouterProvider`, with `AuthProvider`/`PermissionProvider` stubbed (real behavior is `WORK-012`'s scope) but structurally present.
- Redux store shell with empty `authSlice`/`permissionSlice` per `07-FRONTEND-STATE-MANAGEMENT`.
- Centralized Axios instance + `ApiEndpoints` builder + response interceptor error normalization, per `07-FRONTEND-API-CLIENT`, with no real endpoints registered yet.
- Empty route table in `app.routes.tsx` per `07-FRONTEND-REACT-ROUTE` (routes added as each page item lands).

Out of scope:
- Any real page component — those are `WORK-012` through `WORK-017`.
- Wiring to a real backend response shape beyond the documented `{success, message, data, meta}` envelope.

## Dependencies
- Specs: `TECH-FRONTEND`, `SOLUTION-FRONTEND-ARCHITECTURE`, `07-frontend/architecture.md`, `07-frontend/api-client.md`, `07-frontend/state-management.md`, `07-frontend/react-route.md`, `05-ui-ux/design-system.md`.
- Work items: `WORK-000` only affects this item where it touches the auth token transport (the Axios client's handling of cookies vs bearer headers) — the rest of the scaffold does not wait on it.

## Implementation Notes
- `infra/Dockerfile.frontend` (already written) expects a `package.json` at `frontend/` runnable via `npm run dev -- --host 0.0.0.0 --port 5173` — verify the scaffold satisfies that command as-is.
- Do not hard-code any API URL inside a component; all URLs come from the centralized `ApiEndpoints` builder (`AGENTS.md` Frontend Rules).

## Test Plan
- Unit tests: Axios response-interceptor error-normalization mapping, empty reducer shape checks.
- Component tests: none yet (no pages).
- Commands: document `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm run test` once scripts are final.
- Report: `docs/08-testing/reports/frontend/WORK-003-scaffolding-test-report.md`.

## Test Result
**PASS.** `npx tsc -b` (0 errors), `npm run build` (succeeded), `npm run lint` (oxlint, exit 0), `npx vitest run` (18 files / 94 tests, all passed — includes this item's 14 unit tests for the error-normalization function and the `authSlice` reducer). `npm run dev -- --host 0.0.0.0 --port 5173` boots and served HTTP 200. No live-backend integration test was run (none exists yet for any frontend item) — see `docs/08-testing/reports/frontend/WORK-003-scaffolding-test-report.md` for full detail.

## Risks / Ambiguities
- Exact component library / Tailwind plugin set is not approved (`TECH-FRONTEND` pending decisions).
- URL search-param sync behavior for list filters is not approved; the route table can still be built without deciding this now.
