---
id: WORK-015
type: workflow
module: employee
status: draft
depends_on:
  - 07-FRONTEND-PAGES-EMPLOYEE-DETAIL
  - API-EMPLOYEE-DETAIL
---

# WORK-015: Frontend Page — Employee Detail

## Work Status
`IMPLEMENTED` — `EmployeeDetailPage` is built against the documented `GET /api/employees/:id` / `DELETE /api/employees/:id` contracts. Edit and Delete are always visible to any authenticated user — there is no permission gating to speak of (`WORK-000` decision #2), so this item's original "permission-gated button visibility" test requirement does not apply. Department is not displayed (`WORK-000` decision #1). Built without waiting on `WORK-008` (backend) being live; no live end-to-end run against a real backend has been performed yet.

## Summary
Implement `EmployeeDetailPage` per `docs/07-frontend/pages/employee-detail.md`: read-only info tiles plus edit/delete actions gated by permission.

## Scope
In scope:
- `src/features/employee/pages/EmployeeDetailPage.tsx` at `/employees/:id`, guarded by `employee.read`.
- `useEmployeeQuery(id)` (`['employees', id]`).
- Edit button (navigates to `/employees/:id/edit`, gated by `employee.update`) and Delete button (opens the same delete-confirm-popup pattern as the list page, gated by `employee.delete`).

Out of scope:
- List/create/edit pages (`WORK-014`, `WORK-016`, `WORK-017`).

## Dependencies
- Specs: `docs/07-frontend/pages/employee-detail.md`, `API-EMPLOYEE-DETAIL`, `API-EMPLOYEE-DELETE`, `05-ui-ux/pages/employee-detail.md`.
- Work items: `WORK-014`, `WORK-008`.

## Design
- Layout: `AppLayout`, breadcrumb back to list, info tiles (code, name, status, email, department, position — department/status display pending `WORK-000` #1/#2).
- State ownership: server data via TanStack Query; delete popup state local, mirroring `WORK-014`'s pattern.

## Test Plan
- Unit tests: none beyond shared query hook (covered in `WORK-014`/`WORK-008`).
- Component tests: not-found state, loading state, permission-gated button visibility, delete popup reuse.
- Report: `docs/08-testing/reports/frontend/WORK-015-employee-detail-test-report.md`.

## Test Result
**PASS.** 6 component tests for this item (invalid-id state, loading state, not-found state, success rendering of every info tile plus Edit/Delete, and the reused delete-confirm-popup flow ending in navigation to `/employees`), all with mocked `employeeApiService`, part of the full `npx vitest run` result: 18 files / 94 tests, all passed. `npx tsc -b` and `npm run build` also succeeded. Full detail in `docs/08-testing/reports/frontend/WORK-015-employee-detail-test-report.md`.

## Risks / Ambiguities
- Department display is a placeholder until `WORK-000` #1 resolves; status display is a placeholder until #2 resolves.
