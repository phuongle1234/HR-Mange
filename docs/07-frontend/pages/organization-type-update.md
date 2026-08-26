---
id: FRONTEND-ORGANIZATION-TYPE-UPDATE
type: frontend
module: organization-type
status: draft
depends_on:
  - API-ORGANIZATION-TYPE-BY-IDS
  - API-ORGANIZATION-TYPE-UPDATE-MANY
  - FRONTEND-ORGANIZATION-TYPE-LIST
  - FRONTEND-ARCHITECTURE
  - FRONTEND-API-CLIENT
  - FRONTEND-STATE-MANAGEMENT
---

# Organization Type Update

## Purpose
Define the React page behavior for bulk-updating checked organization type rows selected from the list page.

## Route Reference
```text
/organizations/types/update -> OrganizationTypeUpdatePage
```

Route-level decisions:
- Layout: `AppLayout`.
- Auth guard: required.
- Permission model: none.
- Navbar title: `Update Organization Types`.
- Back target: `/organizations/types`.

## Proposed Files
```text
src/features/organization-type/pages/OrganizationTypeUpdatePage.tsx
src/features/organization-type/hooks/useOrganizationTypesByIdsQuery.ts
src/features/organization-type/hooks/useUpdateOrganizationTypesMutation.ts
src/features/organization-type/utils/organization-type-form.ts
src/store/organizationTypeSelection/organizationTypeSelectionSlice.ts
src/shared/components/ContextMenu.tsx
src/shared/hooks/useGridInputNavigation.ts
src/shared/components/FullPageLoadingOverlay.tsx
src/shared/components/ConfirmDialog.tsx
```

## Responsibilities
This spec owns:
- Read selected ids from Redux key `organization_type_checked`.
- Fetch selected rows once through `POST /api/organization-types/by-ids`.
- Prefill editable table-form rows.
- Submit changed rows in one API call.
- Clear selected ids after successful update or when user leaves intentionally.

This spec must not own:
- Long-term server data storage in Redux.
- List-page local selection state.
- Backend uniqueness or not-found rules.

## API Contract
Service methods:

```ts
organizationTypeApiService.findByIds({ ids })
organizationTypeApiService.updateMany({ items })
```

Endpoints:
- `POST /api/organization-types/by-ids`
- `PATCH /api/organization-types`

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| Selected ids | Redux Toolkit | Read from `organization_type_checked`. |
| Fetched selected rows | TanStack Query | Query key `['organization-types', 'by-ids', ids]`. |
| Editable form rows | React Hook Form | Reset from query result after load. |
| Checked local row ids | Local React state | Used to remove rows from the update form only. |
| Mutation pending state | TanStack Mutation | Drives disabled submit and full-page loading overlay. |

## Empty Selection Behavior
If Redux has no selected ids:

```text
Show safe page-level empty state
    ↓
Offer button back to /organizations/types
```

The page must not call `findByIds` with an empty `ids` array.

## Fetch Flow
```text
Route guard passes
    ↓
Read ids from Redux
    ↓
POST /api/organization-types/by-ids
    ↓
Reset React Hook Form rows from returned data
```

If the endpoint returns `ORGANIZATION_TYPE_NOT_FOUND`, render a page-level error and offer navigation back to list.

## Table Form Layout
Columns:

| Column | Input | Validation |
| --- | --- | --- |
| checkbox | row checkbox | Header checkbox checks all loaded rows; when all are checked, clicking removes all checks. |
| `name` | text input | required after trimming, max 100, unique within current form rows |
| `description` | text input or textarea | optional, max 1000 |

The `id` field is hidden form data, not editable.

Page action bar:
- `Cancel` navigates back to `/organizations/types`.
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
| `delete` | Delete | at least one local row checked and more than one row remains | Remove checked rows from the update form only; it does not call delete API. |

There is no `Create items` action on update page. Creating new rows belongs to the create page.

## Keyboard Navigation
Use shared `useGridInputNavigation()` with the same behavior as the create page.

## Submit Flow
```text
Rows loaded from API
    ↓
User edits table rows
    ↓
User submits
    ↓
ConfirmDialog opens
    ↓
User confirms
    ↓
FullPageLoadingOverlay appears
    ↓
PATCH /api/organization-types with { items }
    ↓
Invalidate ['organization-types'] and by-ids query
    ↓
Clear Redux selected ids
    ↓
Redirect to /organizations/types
```

## Loading State
- Initial query loading renders page-level loading state.
- Mutation pending renders full-page loading overlay and disables actions.
- Confirm dialog can be dragged by its header area and closes on outside click when the update mutation is not pending.

## Error State
- Query error renders page-level `ErrorState` with retry when safe.
- API field errors for `items[n].name` and `items[n].description` map to table row inputs.
- Non-field mutation error renders near page actions or inside confirmation popup.
- Do not expose raw backend error objects.

## Success State
- Show top-right toast.
- Redirect to `/organizations/types`.
- Clear `organization_type_checked` from Redux.
- Invalidate `['organization-types']`.

## Validation
Client Zod schema mirrors API:
- `items`: min 1, max 100.
- `items[].id`: UUID.
- `name`: required in the UI form, trimmed, max 100.
- `description`: optional, trimmed, max 1000, empty string converted to `null`.
- duplicate `name` values in current form produce field-level errors.

## Ambiguities
None.
