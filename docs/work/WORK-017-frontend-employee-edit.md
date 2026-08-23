---
id: WORK-017
type: workflow
module: employee
status: draft
depends_on:
  - 07-FRONTEND-PAGES-EMPLOYEE-EDIT
  - API-EMPLOYEE-UPDATE
---

# WORK-017: Frontend Page — Employee Edit

## Work Status
`IMPLEMENTED` — `EmployeeEditPage` is built against the documented `PUT /api/employees/:id` contract (`UpdateEmployeeDto`). The changed-fields diff popup was extended beyond the single-`email`-row example in the UI preview to render one row per actually-changed field (the extension this item's own Risks section flagged as needing confirmation) — confirmed against `docs/05-ui-ux-preview/pages/employee-edit.html` during a design-reference research pass; the preview only ever demonstrates the single-field case, so generalizing to N fields was the safe, non-inventive choice. Built without waiting on `WORK-009` (backend) being live; no live end-to-end run against a real backend has been performed yet.

## Summary
Implement `EmployeeEditPage` per `docs/07-frontend/pages/employee-edit.md`: same sections as Create minus Organization, with a confirm popup that shows only the fields that actually changed.

## Scope
In scope:
- `src/features/employee/pages/EmployeeEditPage.tsx` at `/employees/:id/edit`, guarded by `employee.update`.
- Prefill the form via `useEmployeeQuery(id)`, submit only changed fields through `useUpdateEmployeeMutation()`.
- Confirm popup rendering a changed-fields diff (currently only `email` is shown in the preview per spec; extend the diff logic to whatever fields actually change).

Out of scope:
- List/detail/create pages.

## Dependencies
- Specs: `docs/07-frontend/pages/employee-edit.md`, `API-EMPLOYEE-UPDATE`, `05-ui-ux/pages/employee-edit.md`.
- Work items: `WORK-015`, `WORK-009`.

## Design
- Layout: `AppLayout`, same field sections as Create (Basic/Contact), no Organization section per the UI spec.
- Query/mutation: `useEmployeeQuery(id)` for prefill, `useUpdateEmployeeMutation()` for submit; on success invalidate `['employees']` and `['employees', id]`, navigate back to detail.

## Validation
- React Hook Form/Zod mirrors `UpdateEmployeeDto`: all fields optional, same format rules as create when provided.

## Test Plan
- Unit tests: changed-fields diff helper, update Zod schema.
- Component tests: prefill from query, diff popup content, duplicate-code/email field errors, not-found handling.
- Report: `docs/08-testing/reports/frontend/WORK-017-employee-edit-test-report.md`.

## Test Result
**PASS.** 14 tests for this item (2 edit-schema tests, 3 update-payload-builder tests, 4 changed-fields-diff/form-mapping tests, 5 EmployeeEditPage component tests covering prefill, no-change guard, the changed-field diff popup and its exact-only-changed-field submission, and duplicate-email field errors), all with mocked `employeeApiService`, part of the full `npx vitest run` result: 18 files / 94 tests, all passed. `npx tsc -b` and `npm run build` also succeeded. Full detail in `docs/08-testing/reports/frontend/WORK-017-employee-edit-test-report.md`.

## Risks / Ambiguities
- The diff popup's scope beyond `email` is an extension of what the current UI preview shows; confirm the intended full-diff behavior against `docs/05-ui-ux-preview/pages/employee-edit.html` before finalizing, since that HTML preview is the artifact the spec-sync rule in `AGENTS.md` treats as source of truth for layout.
