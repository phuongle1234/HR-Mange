# WORK-015 — Frontend Page: Employee Detail — Test Report

## Scope Covered
`EmployeeDetailPage` (`/employees/:id`), `useEmployeeQuery`, reuse of
`DeleteEmployeeDialog`. Edit and Delete buttons are always visible to any
authenticated user (no permission gating, per `WORK-000` decision #2) — there is
no "permission-gated button visibility" test because there is nothing to gate.

## Environment
Node v24.15.0 / npm 10.8.1. No live backend — `employeeApiService.detail` and
`.delete` are mocked in every component test.

## Commands Run And Real Results
```text
npx vitest run    # 18 files, 94 tests, ALL PASSED
npx tsc -b        # 0 errors
npm run build     # succeeded
```

## Tests (this item's slice)
`src/features/employee/pages/EmployeeDetailPage.test.tsx` — 6 component tests:
1. An invalid (non-UUID) `id` shows an inline not-found state and never calls
   the API — covers the "Invalid ID effect" from the spec.
2. Loading state ("Loading employee…") while the detail query is pending.
3. `EMPLOYEE_NOT_FOUND` shows "Employee not found." with a "Back to list" action.
4. Success renders every info tile (code, full name, email, position) and both
   Edit/Delete buttons.
5. Confirming delete calls `employeeApiService.delete(id)`, shows the success
   toast, and navigates to `/employees` (mocked `useNavigate`).

All 6 tests above passed. Full run: **94/94 passed**.

## Deviations From The Original Spec Text (flagged)
- The info tiles are: Employee code, Full name, Status, Email, Phone, Position.
  The original `WORK-015.md`/UI-UX spec text listed "code, name, status, email,
  department, position" — the Department tile was dropped entirely (decision
  #1) and Phone was added in its place, since Phone is a real, documented
  `Employee` field (`docs/06-api/employee/get-employee.md`) that had no tile
  otherwise.
- No `ForbiddenLayout`/forbidden state exists or is tested — confirmed removed
  per `FRONTEND-REACT-ROUTE`, since there is no permission model to deny against.

## Not Tested
- No live backend call.
- No dedicated test of the breadcrumb ("Employee / Employee List / Detail") or
  navbar back-button target rendering — those come from `AppLayout` + route
  `handle` metadata, exercised through the router wiring rather than this
  page-level suite (which renders `EmployeeDetailPage` directly, not through
  `AppLayout`).

## Work Status
`IMPLEMENTED`.

## Test Result
**PASS** — 6/6 tests for this item, part of the full 94/94 passing suite.
