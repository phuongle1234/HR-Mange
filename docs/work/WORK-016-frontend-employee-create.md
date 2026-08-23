---
id: WORK-016
type: workflow
module: employee
status: draft
depends_on:
  - 07-FRONTEND-PAGES-EMPLOYEE-CREATE
  - API-EMPLOYEE-CREATE
---

# WORK-016: Frontend Page — Employee Create

## Work Status
`IMPLEMENTED` — `EmployeeCreatePage` is built against the documented `POST /api/employees` contract (`CreateEmployeeDto`'s validation table). There is no Department field at all (`WORK-000` decision #1 — removed entirely, not merely disabled as the original UI preview showed); the "Organization Information" section now holds only Position. Post-success navigation goes to the created employee's own `/employees/:id` (this task's decision, superseding the original spec's "proposed" note). Built without waiting on `WORK-007` (backend) being live; no live end-to-end run against a real backend has been performed yet.

## Summary
Implement `EmployeeCreatePage` per `docs/07-frontend/pages/employee-create.md`: sectioned form (Basic/Contact/Organization) with a submit confirm popup.

## Scope
In scope:
- `src/features/employee/pages/EmployeeCreatePage.tsx` at `/employees/create`, guarded by `employee.create`.
- React Hook Form + Zod schema matching `CreateEmployeeDto`'s validation table.
- Submit confirm popup showing name/email review before calling `useCreateEmployeeMutation()`.
- Department field rendered disabled/blocked per the UI spec, matching the backend's blocked state.

Out of scope:
- List/detail/edit pages.

## Dependencies
- Specs: `docs/07-frontend/pages/employee-create.md`, `API-EMPLOYEE-CREATE`, `05-ui-ux/pages/employee-create.md`.
- Work items: `WORK-014`, `WORK-007`.

## Design
- Layout: `AppLayout`, form sections per `05-ui-ux/pages/employee-create.md`.
- Query/mutation: `useCreateEmployeeMutation()`; on success, invalidate `['employees']` and navigate to the detail page (or list — return target is "proposed", per spec).
- Error mapping: `EMPLOYEE_CODE_EXISTS`/`EMPLOYEE_EMAIL_EXISTS` → field errors on `employeeCode`/`email`; `DEPARTMENT_NOT_DEFINED` → non-field notice.

## Validation
- React Hook Form/Zod mirrors `CreateEmployeeDto`: required `employeeCode`/`firstName`/`lastName`/`email`, optional `phone`/`position`/`status`.

## Test Plan
- Unit tests: create Zod schema, field-error mapping table.
- Component tests: confirm popup review content, success flow (mocked mutation), duplicate-code/email field errors.
- Report: `docs/08-testing/reports/frontend/WORK-016-employee-create-test-report.md`.

## Test Result
**PASS.** 21 tests for this item (9 create-schema tests, 2 payload-builder tests, 4 field-error-mapping tests, 6 EmployeeCreatePage component tests covering the confirm-popup review, success navigation, duplicate-code/email field errors, and non-field error handling), all with mocked `employeeApiService`, part of the full `npx vitest run` result: 18 files / 94 tests, all passed. `npx tsc -b` and `npm run build` also succeeded. Full detail in `docs/08-testing/reports/frontend/WORK-016-employee-create-test-report.md`.

## Risks / Ambiguities
- Post-success navigation target is only proposed, not approved.
- Field max lengths mirror the unapproved defaults in `DB-EMPLOYEE`.
