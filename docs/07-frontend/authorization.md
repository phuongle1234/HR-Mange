---
id: FRONTEND-AUTHORIZATION
type: frontend
module: global
status: draft
depends_on:
  - API-AUTHORIZATION
  - FRONTEND-AUTHENTICATION
---

# Authorization

## Resolved Model (`WORK-000` decision #2)
There is no permission/role model. This spec (previously a full `PermissionProvider`/`usePermission()`/`PermissionGuard` design) is now void: none of those files, hooks, or components exist.

## What Replaces It
- `AuthGuard` alone protects every route that requires a logged-in user (see `FRONTEND-REACT-ROUTE`).
- Every page shows every action (Create/Edit/Delete buttons, etc.) to any authenticated user — there is no per-action visibility check.
- Backend authentication (not authorization) remains the only real security boundary; the frontend never adds one.

## If This Changes Later
Reintroducing permission-aware UI is a new work item: it would recreate `PermissionProvider`, `usePermission()`, a permission Redux slice, and `PermissionGuard`, and would need `SOLUTION-AUTHORIZATION`/`API-AUTHORIZATION` to define a real permission source first. Nothing in the current frontend code should be written to anticipate that shape speculatively.
