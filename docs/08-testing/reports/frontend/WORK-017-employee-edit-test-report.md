# WORK-017 — Frontend Page: Employee Edit — Test Report

## Scope Covered
`EmployeeEditPage` (`/employees/:id/edit`), `employeeEditSchema`,
`buildUpdateEmployeePayload`, `buildChangedFieldsReview`, `mapEmployeeToFormValues`,
`useUpdateEmployeeMutation`.

## Environment
Node v24.15.0 / npm 10.8.1. No live backend — `employeeApiService.detail` and
`.update` are mocked in every component test.

## Commands Run And Real Results
```text
npx vitest run    # 18 files, 94 tests, ALL PASSED
npx tsc -b        # 0 errors
npm run build     # succeeded
```

## Tests (this item's slice)
`src/features/employee/schemas/employee.schemas.test.ts` (employeeEditSchema
part) — 2 tests: accepts the same valid payload as create; rejects an invalid
email when provided.

`src/features/employee/utils/build-employee-payload.test.ts` (update part) —
3 tests: includes only React-Hook-Form-dirty fields; returns `{}` when nothing
is dirty; includes every dirty field, normalized, when several change at once.

`src/features/employee/utils/employee-form-mapping.test.ts` — 4 tests:
`mapEmployeeToFormValues` converts `null` phone/position to `''` for the form;
`buildChangedFieldsReview` builds the previous -> next row for a single changed
field (matches the edit preview's one-row example exactly:
`mai@example.com -> mai.updated@example.com`); builds one row per field when
several change; renders an em-dash placeholder when the previous value was
empty.

`src/features/employee/pages/EmployeeEditPage.test.tsx` — 5 component tests:
1. The form prefills from the fetched employee (`getByDisplayValue` on every
   field).
2. `EMPLOYEE_NOT_FOUND` on the detail fetch shows "Employee not found.".
3. Submitting with no changes shows "No changes to save." and never opens the
   popup or calls `update`.
4. Changing only the email shows the confirm popup with exactly one review row
   (`mai@example.com -> mai.updated@example.com`), and confirming calls
   `employeeApiService.update(id, { email: 'mai.updated@example.com' })` —
   i.e. **only the changed field**, not the whole form — then shows the success
   toast and navigates to `/employees/:id`.
5. `EMPLOYEE_EMAIL_EXISTS` closes the popup and shows the error under "Email".

All 14 tests above passed. Full run: **94/94 passed**.

## Deviations / Confirmations Against The Stated Ambiguity
`WORK-017.md`'s own Risks section flagged that the diff popup's behavior beyond
a single `email` example needed confirming against
`docs/05-ui-ux-preview/pages/employee-edit.html`. This was checked (via the
design-digest research pass): the preview only ever demonstrates a single
changed field. The implemented `buildChangedFieldsReview` generalizes that
pattern to **any number** of changed fields — each dirty field gets its own
"label: previous -> next" row — since limiting the popup to one field
regardless of how many actually changed would silently hide information from
the user before they confirm. This is the extension the risk note anticipated
needing; it is now implemented and covered by the "row per changed field" test
above.

- No Organization/Department section on this page (matches both the static
  preview and the decision to remove Department entirely) — only Basic
  Information and Contact Information, per `05-ui-ux/pages/employee-edit.md`.
- Post-success navigation: back to `/employees/:id`, per the task's decision
  list (this item's original spec only called it "proposed").

## Not Tested
- No live backend call.
- No test of the edit page's navbar back-button target resolving the `:id`
  placeholder (`/employees/:id`) — that logic lives in `AppLayout`'s
  `resolveBackTarget`, exercised through the router, not this page-level suite.

## Work Status
`IMPLEMENTED`.

## Test Result
**PASS** — 14/14 tests for this item, part of the full 94/94 passing suite.
