---
id: FRONTEND-EMPLOYEE-EDIT
type: frontend
module: employee
status: draft
depends_on:
  - API-EMPLOYEE-BY-IDS
  - API-EMPLOYEE-BULK-UPDATE
  - FRONTEND-EMPLOYEE-LIST
  - FRONTEND-ARCHITECTURE
  - FRONTEND-API-CLIENT
  - FRONTEND-STATE-MANAGEMENT
---

# Employee Update

## Purpose
Define the React page behavior for bulk-updating checked employee rows selected from the list page. **Superseded (2026-08-26 daily task, §5):** the previous single-record `/employees/:id/edit` page is replaced by this bulk workflow, mirroring `FRONTEND-ORGANIZATION-TYPE-UPDATE` exactly, plus the same Organization `react-select` column as `FRONTEND-EMPLOYEE-CREATE`.

## Route Reference
```text
/employees/update -> EmployeeUpdatePage
```
**Route change:** `/employees/:id/edit` (`EmployeeEditPage`, single-record) is removed. The per-row "Edit" action/route on the Employee List and Detail pages is removed along with it — bulk-select + this page is now the only way to edit employees, matching the Organization Type list/update pattern. See `FRONTEND-EMPLOYEE-LIST` for the corresponding List page changes (checkbox selection, context menu). The Employee Detail page (`/employees/:id`, read-only) is unaffected — it keeps its own route and is not part of this bulk workflow.

Route-level decisions:
- Layout: `AppLayout`.
- Auth guard: required.
- Permission model: none.
- Navbar title: `Update Employees`.
- Back target: `/employees`.

## Proposed Files
```text
src/features/employee/pages/EmployeeUpdatePage.tsx
src/features/employee/hooks/useEmployeesByIdsQuery.ts
src/features/employee/hooks/useBulkUpdateEmployeesMutation.ts
src/features/employee/hooks/useOrganizationOptionsQuery.ts
src/features/employee/components/OrganizationSelectCell.tsx
src/store/employeeSelection/employeeSelectionSlice.ts
src/shared/components/ContextMenu.tsx
src/shared/hooks/useGridInputNavigation.ts
src/shared/components/FullPageLoadingOverlay.tsx
src/shared/components/ConfirmDialog.tsx
```

## Responsibilities
This spec owns:
- Read selected ids from Redux key `employee_checked`.
- Fetch selected rows once through `POST /api/employees/by-ids`.
- Prefill editable table-form rows, including each row's Organization select from `organizationId`.
- Submit changed rows in one API call.
- Clear selected ids after successful update or when user leaves intentionally.

This spec must not own:
- Long-term server data storage in Redux.
- List-page local selection state.
- Backend uniqueness or not-found rules.
- Fetching Organization options per row (same rule as `FRONTEND-EMPLOYEE-CREATE`).

## API Contract
Service methods:

```ts
employeeApiService.findByIds({ ids })
employeeApiService.bulkUpdate({ items })
organizationApiService.list()
```

Endpoints:
- `POST /api/employees/by-ids`
- `PATCH /api/employees/bulk`
- `GET /api/organizations`

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| Selected ids | Redux Toolkit | Read from `employee_checked`. |
| Fetched selected rows | TanStack Query | Query key `['employees', 'by-ids', ids]`. |
| Organization select options | TanStack Query | Query key `['organizations']`, shared with the Create page's fetch-once behavior. |
| Editable form rows | React Hook Form | Reset from query result after load. |
| Checked local row ids | Local React state | Used to remove rows from the update form only. |
| Mutation pending state | TanStack Mutation | Drives disabled submit and full-page loading overlay. |

## Empty Selection Behavior
If Redux has no selected ids:

```text
Show safe page-level empty state
    ↓
Offer button back to /employees
```

The page must not call `findByIds` with an empty `ids` array.

## Fetch Flow
```text
Route guard passes
    ↓
Read ids from Redux
    ↓
POST /api/employees/by-ids
    ↓
Reset React Hook Form rows from returned data (organizationId included)
```

If the endpoint returns `EMPLOYEE_NOT_FOUND`, render a page-level error and offer navigation back to list.

## Table Form Layout
Same columns as `FRONTEND-EMPLOYEE-CREATE`'s table (`employeeCode`, `firstName`, `lastName`, `email`, `phone`, `position`, `status`, `organization` via `react-select`), prefilled from the fetched rows. The `id` field is hidden form data, not editable. `userId` is never shown/editable on this page — it is set only by the Invitation-accept flow.

Page action bar:
- `Cancel` navigates back to `/employees`.
- `Submit` runs React Hook Form validation and opens the confirm dialog when valid.
- Submit is disabled while the form is invalid or the update mutation is pending.

The editable table may scroll horizontally/vertically inside its container without leaving the form page.

## Context Menu
Open source:
- `onContextMenu` on the table-form container.

Items:

| Key | Label | Enabled When | Behavior |
| --- | --- | --- | --- |
| `submit` | Submit | form valid and at least one row | Open submit confirmation popup. |
| `delete` | Delete | at least one local row checked and more than one row remains | Remove checked rows from the update form only; it does not call the delete API. |

There is no `Create items` action on this page — creating new rows belongs to `/employees/create`.

## Keyboard Navigation
Use shared `useGridInputNavigation()`, same behavior as `FRONTEND-EMPLOYEE-CREATE`, including the Organization select cell.

## Submit Flow
```text
Rows loaded from API
    ↓
User edits table rows (including Organization select per row)
    ↓
User submits
    ↓
ConfirmDialog opens
    ↓
User confirms
    ↓
FullPageLoadingOverlay appears
    ↓
PATCH /api/employees/bulk with { items }
    ↓
Invalidate ['employees'] and by-ids query
    ↓
Clear Redux selected ids
    ↓
Redirect to /employees
```

## Loading State
- Initial query loading renders page-level loading state.
- Mutation pending renders full-page loading overlay and disables actions.
- Confirm dialog can be dragged by its header area and closes on outside click when the update mutation is not pending.

## Error State
- Query error renders page-level `ErrorState` with retry when safe.
- API field errors for `items[n].*` map to table row inputs, including `items[n].organizationId`.
- Non-field mutation error renders near page actions or inside confirmation popup.
- Do not expose raw backend error objects.

## Success State
- Show top-right toast.
- Redirect to `/employees`.
- Clear `employee_checked` from Redux.
- Invalidate `['employees']`.

## Validation
Client Zod schema mirrors API (`API-EMPLOYEE-BULK-UPDATE`):
- `items`: min 1, max 100.
- `items[].id`: UUID.
- `employeeCode`/`email`: unique within current form rows when present.
- `organizationId`: optional integer or `null`.

## Ambiguities
None blocking. Treating "replace `/employees/:id/edit` with bulk-only editing" as the intended reading of task §5 ("Employee Create/Edit không thao tác với một Employee duy nhất") is this contract's own inference, not a line the daily task states route-by-route — recorded here so the backend/frontend agents implement the same assumption rather than two different ones.
