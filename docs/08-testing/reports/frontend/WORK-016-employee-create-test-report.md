# WORK-016 — Frontend Page: Employee Create — Test Report

## Scope Covered
`EmployeeCreatePage` (`/employees/create`), `employeeCreateSchema`,
`buildCreateEmployeePayload`, `mapEmployeeFormError`, `useCreateEmployeeMutation`.

## Environment
Node v24.15.0 / npm 10.8.1. No live backend — `employeeApiService.create` is
mocked in every component test.

## Commands Run And Real Results
```text
npx vitest run    # 18 files, 94 tests, ALL PASSED
npx tsc -b        # 0 errors
npm run build     # succeeded
```

## Tests (this item's slice)
`src/features/employee/schemas/employee.schemas.test.ts` (employeeCreateSchema
part) — 9 tests: valid payload accepted; optional phone/position accepted empty;
missing employeeCode/firstName rejected; invalid email rejected; employeeCode
>50 chars rejected; invalid status rejected; every real `EmployeeStatus` value
accepted; **no `departmentId` field exists on the schema at all** (explicit
assertion, decision #1).

`src/features/employee/utils/build-employee-payload.test.ts` (create part) —
2 tests: trims/lowercases values; omits blank optional fields as `undefined`
instead of sending empty strings.

`src/features/employee/utils/map-employee-error.test.ts` — 4 tests covering the
full field-error mapping table: `EMPLOYEE_CODE_EXISTS` -> `employeeCode`,
`EMPLOYEE_EMAIL_EXISTS` -> `email`, `VALIDATION_ERROR.fieldErrors` applied and
reports the first field, `EMPLOYEE_NOT_FOUND` -> safe form-level message with no
field touched (used the same way by both create/update error paths).

`src/features/employee/pages/EmployeeCreatePage.test.tsx` — 6 component tests:
1. Submitting the empty form shows field validation errors and never opens the
   confirm popup.
2. A valid submit opens "Confirm Create Employee" showing the full name and
   email review rows.
3. Confirming calls `employeeApiService.create` with the built payload, shows
   the success toast, and navigates to `/employees/emp-new` (the created
   record's own id — mocked `useNavigate`).
4. `EMPLOYEE_CODE_EXISTS` closes the popup and shows the error under the
   "Employee code" field.
5. `EMPLOYEE_EMAIL_EXISTS` closes the popup and shows the error under "Email".
6. A non-field error (`INTERNAL_ERROR`) keeps the popup open and renders the
   safe message inside it, per spec.

All 21 tests above passed. Full run: **94/94 passed**.

## Deviations From The Original Spec Text (flagged)
- **Department field removed entirely** (decision #1) — the "Organization
  Information" section now contains only "Position"; the static preview's
  disabled Department `<select>` does not exist in this implementation at all
  (there is nothing to disable — the field itself is gone).
- **Post-success navigation**: navigates to `/employees/:id` of the newly
  created record. This was listed as only "proposed" in the original
  `WORK-016.md`; the task's decision list fixes it as the actual behavior, and
  that is what's implemented and tested.
- Field max lengths (employeeCode 50, names 100, email 255, phone 30, position
  100) mirror `WORK-000`'s documented (not user-confirmed) defaults.

## Not Tested
- No live backend call, so the real `EMPLOYEE_CODE_EXISTS`/`EMPLOYEE_EMAIL_EXISTS`
  conflict detection logic (which lives in the backend) is not exercised — only
  the frontend's handling of that error code once received.

## Work Status
`IMPLEMENTED`.

## Test Result
**PASS** — 21/21 tests for this item, part of the full 94/94 passing suite.
