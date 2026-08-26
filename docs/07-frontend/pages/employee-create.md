---
id: FRONTEND-EMPLOYEE-CREATE
type: frontend
module: employee
status: draft
depends_on:
  - API-EMPLOYEE-BULK-CREATE
  - DB-ORGANIZATION
  - FRONTEND-ARCHITECTURE
  - FRONTEND-API-CLIENT
  - FRONTEND-STATE-MANAGEMENT
---

# Employee Create

## Purpose
Define the React page behavior for creating one or more employee rows in a bulk table-form workflow. **Superseded (2026-08-26 daily task, §5):** this page is no longer a single-record form — it mirrors `FRONTEND-ORGANIZATION-TYPE-CREATE`'s bulk table editor pattern exactly, plus one addition: an Organization column backed by `react-select`.

## Route Reference
```text
/employees/create -> EmployeeCreatePage
```
Route path is unchanged; only the page's content/behavior changes (single-record form -> bulk table editor).

Route-level decisions:
- Layout: `AppLayout`.
- Auth guard: required.
- Permission model: none.
- Navbar title: `Create Employees`.
- Back target: `/employees`.

## Proposed Files
```text
src/features/employee/pages/EmployeeCreatePage.tsx
src/features/employee/schemas/employee-bulk.schema.ts
src/features/employee/utils/employee-bulk-form.ts
src/features/employee/hooks/useBulkCreateEmployeesMutation.ts
src/features/employee/hooks/useOrganizationOptionsQuery.ts
src/features/employee/components/OrganizationSelectCell.tsx
src/shared/components/ContextMenu.tsx
src/shared/hooks/useGridInputNavigation.ts
src/shared/components/FullPageLoadingOverlay.tsx
src/shared/components/ConfirmDialog.tsx
```

## Pre-Implementation Check (task §5.5, mandatory before coding)
`react-select` is not currently a dependency (confirmed absent from `frontend/package.json`). Before wiring the Organization column:
1. `npm view react-select peerDependencies` — confirm compatibility with the project's React `^19.2.8`.
2. `npm install react-select@5.10.2` (task's preferred version) unless the peer-dependency check above shows a real incompatibility.
3. `npm run build` — confirm no peer/build errors.
4. Do not downgrade React to accommodate `react-select` (task, explicit). If a real React 19 incompatibility is found, report it before substituting another library — do not silently swap libraries.

## Responsibilities
This spec owns:
- Render table-form rows for bulk create, including an Organization `react-select` cell per row.
- Use React Hook Form (`useFieldArray`) and Zod validation.
- Load the Organization options list once for the whole table (task §5.6 — not per-row).
- Add/delete editable rows.
- Check all/remove all local rows for deletion.
- Open reusable context menu from right-click.
- Confirm before submitting.
- Submit all rows in one API call.

This spec must not own:
- Database uniqueness enforcement.
- Server state storage in Redux.
- Direct Axios calls.
- Fetching Organization options per row (task §5.15, explicit performance rule).

## API Contract
Service methods:

```ts
employeeApiService.bulkCreate({ items })
organizationApiService.list()   // for the Organization select options, no filter
```

Endpoints:
- `POST /api/employees/bulk`
- `GET /api/organizations`

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| Form rows and field errors | React Hook Form | Use `useFieldArray`. |
| Organization select options | TanStack Query | Query key `['organizations']`, `staleTime` long enough that navigating between rows never refetches — fetched once, reused by every row's `react-select`. |
| Checked local row ids | Local React state | Used only to remove rows from the form. |
| Confirm popup state | Local React state | Stores pending submit intent. |
| Mutation pending state | TanStack Mutation | Drives disabled submit and full-page loading overlay. |

## Table Form Layout
Columns:

| Column | Input | Validation |
| --- | --- | --- |
| checkbox | row checkbox | Header checkbox checks all rows; when all rows are checked, clicking removes all checks. |
| `employeeCode` | text input | required, max 50, unique within current form rows |
| `firstName` | text input | required, max 100 |
| `lastName` | text input | required, max 100 |
| `email` | text input | required, valid email, max 255, unique within current form rows |
| `phone` | text input | optional, max 30 |
| `position` | text input | optional, max 100 |
| `status` | select | one of `ACTIVE`/`INACTIVE`/`ON_LEAVE`/`TERMINATED`, default `ACTIVE` |
| `organization` | `react-select`, options from `['organizations']`, `isClearable` | optional; stores `organizationId` (the option's `value`), not the display name (task §4, explicit: "Không lưu Organization Name thay cho FK") |

Validation messages appear below the related input inside the same table cell.

### Organization Select Cell
Follows task §5.7-§5.9 exactly:

```ts
const organizationOptions = organizations.map((organization) => ({
  value: organization.id,
  label: organization.name,
}));
```

```tsx
<Select
  options={organizationOptions}
  value={organizationOptions.find((option) => option.value === row.organizationId) ?? null}
  onChange={(option) => updateEmployeeRow(index, { organizationId: option?.value ?? null })}
  isClearable
/>
```

- If the bulk form uses React Hook Form `useFieldArray` (task §5.10 preference), wrap the `react-select` with RHF's `Controller` per row.
- Changing one row's Organization select must only update that row's `organizationId` — never any other row (task §5.8, explicit).
- `Organization.id` is a **number**, not a UUID string (`DB-ORGANIZATION`'s recorded PK deviation) — the option `value`/form field type must be `number | null`, not `string | null`.

Page action bar:
- `Cancel` navigates back to `/employees`.
- `Add Row` appends one empty editable row.
- `Submit` runs React Hook Form validation and opens the confirm dialog when valid.
- Submit is disabled while the form is invalid, the create mutation is pending, or the Organization options query is still loading.

The editable table may scroll horizontally/vertically inside its container without leaving the form page.

## Context Menu
Open source:
- `onContextMenu` on the table-form container.

Items:

| Key | Label | Enabled When | Behavior |
| --- | --- | --- | --- |
| `submit` | Submit | form valid and at least one row | Open submit confirmation popup. |
| `create-items` | Create items | always | Append one empty row. |
| `delete` | Delete | at least one local row checked and more than one row remains | Remove checked rows from the form. |

## Keyboard Navigation
Use shared hook `useGridInputNavigation()`, same behavior as `FRONTEND-ORGANIZATION-TYPE-CREATE`. The Organization `react-select` cell participates in the same row/column grid registration as the plain text inputs so Arrow key navigation still moves through it in order (task §5.15 does not exempt it).

## Submit Flow
```text
User edits table rows (including Organization select per row)
    ↓
User clicks submit button or context-menu Submit
    ↓
React Hook Form validates through Zod
    ↓
ConfirmDialog opens
    ↓
User confirms
    ↓
FullPageLoadingOverlay appears
    ↓
POST /api/employees/bulk with { items }
    ↓
Invalidate ['employees']
    ↓
Redirect to /employees
```

## Loading State
- Submit button disabled while invalid, mutation pending, or Organization options still loading.
- Full-page loading overlay appears after confirmation while mutation is pending.
- Confirm dialog can be dragged by its header area and closes on outside click when the create mutation is not pending.

## Error State
- Field errors render under inputs, including the Organization cell (`ORGANIZATION_NOT_FOUND` maps to `items[n].organizationId`).
- API field errors for `items[n].employeeCode`/`items[n].email` map to the corresponding row.
- Non-field mutation error renders near the page actions or inside confirmation popup.
- If the Organization options query fails, render an inline retry affordance in place of the select column header rather than blocking the whole page — rows can still be edited/submitted with `organizationId` left unset.
- Do not expose raw backend error objects.

## Success State
- Show top-right toast.
- Redirect to `/employees`.
- Invalidate `['employees']`.

## Validation
Client Zod schema mirrors API (`API-EMPLOYEE-BULK-CREATE`):
- `items`: min 1, max 100.
- `employeeCode`/`email`: required, trimmed, unique within current form rows.
- `firstName`/`lastName`: required, trimmed, max 100.
- `organizationId`: optional integer or `null`.
- Uniqueness against the database is not checked client-side; remains API responsibility.

## Ambiguities
None blocking. Whether the Employee Detail page (`/employees/:id`, unaffected by this task) should also display the employee's Organization name is not specified — left as a natural, low-risk follow-up for whichever agent implements this, not required for this contract's acceptance criteria.
