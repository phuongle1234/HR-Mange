---
id: WORK-014
type: workflow
module: employee
status: draft
depends_on:
  - FRONTEND-EMPLOYEE-LIST
  - API-EMPLOYEE-LIST
  - API-EMPLOYEE-DELETE
---

# WORK-014: Frontend Page — Employee List

## Work Status
`IMPLEMENTED` — `EmployeeListPage` is built against the documented `GET /api/employees` / `DELETE /api/employees/:id` contracts, reusing the authenticated shell from `WORK-012`. Built without waiting on `WORK-008`/`WORK-010` (backend) being live, per this task's instruction to build against the documented contract. There is no permission gating on any action (`WORK-000` decision #2) and no `departmentId` filter/column (`WORK-000` decision #1) — both remove ambiguity this item's original Risks section otherwise would have carried. No live end-to-end run against a real backend has been performed yet.

## Summary
Implement `EmployeeListPage` per `FRONTEND-EMPLOYEE-LIST`: table + toolbar, TanStack Query-backed list, and the delete confirm popup flow.

## Scope
In scope:
- `src/features/employee/pages/EmployeeListPage.tsx` at `/employees`, guarded by `employee.read`.
- `useEmployeesQuery(queryState)` (`['employees', queryState]`) with search/pagination local state.
- Delete confirm popup wired to `useDeleteEmployeeMutation()`, invalidating `['employees']` on success, per the exact open/confirm/cancel flow in `FRONTEND-EMPLOYEE-LIST`.
- Navigation to create/detail/edit routes.

Out of scope:
- Detail/create/edit pages (`WORK-015`–`WORK-017`).

## Dependencies
- Specs: `FRONTEND-EMPLOYEE-LIST`, `API-EMPLOYEE-LIST`, `API-EMPLOYEE-DELETE`, `05-ui-ux/pages/employee-list.md`.
- Work items: `WORK-012`, `WORK-008` (read), `WORK-010` (delete — the popup itself can ship even if `DELETE_STRATEGY_NOT_APPROVED` is still the only server response; that becomes a documented known issue, not a blocker for building the UI).

## Design
- Layout: `AppLayout` (navbar + sidebar), breadcrumb + toolbar + table per `05-ui-ux/layout.md`.
- State ownership: exactly as tabulated in `FRONTEND-EMPLOYEE-LIST` (auth/permission from providers, search/filter/page local, list data via TanStack Query, delete popup state local).

## Validation
- No form validation on this page; delete confirm popup only needs a selected-employee guard before calling the mutation.

## Test Plan
- Unit tests: query-key builder, filter-state reducer if any.
- Component tests: loading/empty/error/success table states; delete popup open/confirm/cancel flow (mocked mutation); toast on success.
- Report: `docs/08-testing/reports/frontend/WORK-014-employee-list-test-report.md`.

## Test Result
**PASS.** 10 tests for this item (3 query-key tests, 7 EmployeeListPage component tests covering loading/empty/error/success states and the full delete-popup open/confirm/cancel/error flow, all with mocked `employeeApiService`), part of the full `npx vitest run` result: 18 files / 94 tests, all passed. `npx tsc -b` and `npm run build` also succeeded. Full detail in `docs/08-testing/reports/frontend/WORK-014-employee-list-test-report.md`.

## Risks / Ambiguities
- Search debounce timing, pagination default page size, department/status filters, and toast duration are all unapproved per `FRONTEND-EMPLOYEE-LIST` Pending Decisions — ship reasonable defaults and flag them.
