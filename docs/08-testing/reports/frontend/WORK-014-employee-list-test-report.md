# WORK-014 — Frontend Page: Employee List — Test Report

## Scope Covered
`EmployeeListPage` (`/employees`), `useEmployeesQuery`, `useDeleteEmployeeMutation`,
`employeeQueryKeys`, the shared `DeleteEmployeeDialog`. No permission gating on
any action (every authenticated user sees Create/Detail/Edit/Delete, per
`WORK-000` decision #2). No `departmentId` filter or column (decision #1).

## Environment
Node v24.15.0 / npm 10.8.1. No live backend — `employeeApiService.list` and
`.delete` are mocked in every component test.

## Commands Run And Real Results
```text
npx vitest run    # 18 files, 94 tests, ALL PASSED
npx tsc -b        # 0 errors
npm run build     # succeeded
```

## Tests (this item's slice)
`src/features/employee/utils/query-keys.test.ts` — 3 tests: stable/serializable
list key from query state; detail key from id; the `['employees']` prefix
matches both list and detail keys (so a single invalidate call covers both).

`src/features/employee/pages/EmployeeListPage.test.tsx` — 7 component tests:
1. Loading state ("Loading employees…") while the query is pending.
2. Empty state ("No employees found.") when the list resolves to zero rows.
3. Error state with a "Retry" button when the query rejects.
4. Success state renders the table with both mocked rows and the
   "Showing 1-2 of 2 employees" pagination summary.
5. Delete popup opens (shows the row's code/name in the summary) and Cancel
   closes it without calling `delete`.
6. Confirming delete calls `employeeApiService.delete('emp-1')`, shows the
   `react-toastify` success toast, and closes the popup.
7. A failed delete keeps the popup open and renders the safe error message
   below the confirm/cancel buttons.

All 10 tests above passed. Full run: **94/94 passed**.

## Deviations / Assumptions (flagged per the Risks section of `WORK-014.md`)
- **Search debounce**: 400ms, implemented via `useDebouncedValue` — an
  implementation default, not separately user-confirmed (spec explicitly allows
  this).
- **Pagination**: default page size 10; UI uses a simple "Previous / Page X of Y
  / Next" control instead of the static preview's numbered page buttons (1, 2, …),
  since the preview's numbered buttons don't scale to an arbitrary `total` from a
  real backend. This is a deliberate simplification, not an oversight.
- **No URL search-param sync** — `FRONTEND-EMPLOYEE-LIST` lists this as optional
  ("if approved"); it was not implemented, so filters/search/page reset when the
  page reloads or is linked directly. Flagged as a possible follow-up, not a bug.
- **Status filter options**: `ACTIVE`/`INACTIVE`/`ON_LEAVE`/`TERMINATED` plus an
  "All statuses" option — the enum itself is `WORK-000`-decided; the filter UI
  shape is this implementation's own default.
- Table columns are Employee Code, Full Name, Email, Phone, Position, Status,
  Actions — the Department column from the static preview was dropped entirely,
  per decision #1 (see the final report's stale-preview-content note).

## Not Tested
- No live backend call.
- No test of search/status filter interaction directly changing the rendered
  rows (the debounced-search and filter-driven refetch logic is exercised
  structurally through the query-key test, not through a full typing-and-refetch
  component test, to keep the suite from depending on real debounce timing).

## Work Status
`IMPLEMENTED`.

## Test Result
**PASS** — 10/10 tests for this item, part of the full 94/94 passing suite.
