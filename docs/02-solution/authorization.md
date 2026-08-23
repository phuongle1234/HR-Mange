---
id: SOLUTION-AUTHORIZATION
type: solution
module: global
status: draft
---

# Authorization

## Purpose
Define authorization behavior across backend and frontend.

## Resolved Model (`WORK-000` decision #2)
No role or permission model exists. Authorization is binary: authenticated or not. There is no `employee.read`/`employee.create`/etc. permission concept anywhere in this system for this phase.

## Backend Authorization
- Backend checks only that the request carries a valid, unexpired access token belonging to an active user.
- Backend remains the final security boundary.
- Missing/invalid token returns `UNAUTHORIZED` (401); there is no `FORBIDDEN` (403) permission-denial path in this phase.

## Frontend Authorization
- `AuthGuard` protects routes: authenticated users can reach every protected route; unauthenticated users are redirected to `/login`.
- There is no `PermissionProvider`, `PermissionGuard`, or `usePermission()` — those were removed along with the permission model. Every authenticated user sees every action button (Create/Edit/Delete) on every page.

## Future Extension
If tiered access is needed later, reintroducing a role/permission model is a new, separate work item (new `DB-USER` fields/tables, new API checks, new frontend provider) — not a patch layered on top of this simplified model.
