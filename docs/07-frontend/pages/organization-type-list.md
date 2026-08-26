---
id: FRONTEND-ORGANIZATION-TYPE-LIST
type: frontend
module: organization-type
status: draft
depends_on:
  - API-ORGANIZATION-TYPE-LIST
  - API-ORGANIZATION-TYPE-DELETE-MANY
  - FRONTEND-ARCHITECTURE
  - FRONTEND-API-CLIENT
  - FRONTEND-STATE-MANAGEMENT
---

# Organization Type List

## Purpose
Define the React page behavior for listing and bulk-selecting organization types. This page is the level-2 menu item under the level-1 Organization sidebar group.

## Route Reference
```text
/organizations/types -> OrganizationTypeListPage
```

Route-level decisions:
- Layout: `AppLayout`.
- Auth guard: required.
- Permission model: none.
- Navbar title: `Organization Types`.
- Sidebar group: `Organization`.
- Sidebar item: `Organization Types`.

## Proposed Files
```text
src/features/organization-type/pages/OrganizationTypeListPage.tsx
src/features/organization-type/types/organization-type.types.ts
src/features/organization-type/services/organization-type.api.ts
src/features/organization-type/hooks/useOrganizationTypesQuery.ts
src/features/organization-type/hooks/useDeleteOrganizationTypesMutation.ts
src/features/organization-type/utils/query-keys.ts
src/store/organizationTypeSelection/organizationTypeSelectionSlice.ts
src/shared/components/ContextMenu.tsx
src/shared/components/SearchAndFilterBar.tsx
src/shared/components/SortableTableHeader.tsx
src/shared/hooks/useDebounce.ts
src/shared/hooks/useListQueryState.ts
```

## Responsibilities
This spec owns:
- Render searchable, paginated organization type table.
- Let the user change page size through the shared toolbar limit selector.
- Let the user sort supported columns through the shared sortable table-header control.
- Manage checked row ids locally until the user chooses Update.
- Store checked ids in Redux only when navigating to the bulk update page.
- Open a reusable context menu from right-click.
- Confirm and call bulk delete once with selected ids.

This spec must not own:
- Backend validation.
- Direct Axios calls.
- Form values for create/update pages.
- Server list data in Redux.

## API Contract
Service methods:

```ts
organizationTypeApiService.list(query)
organizationTypeApiService.deleteMany({ ids })
```

Endpoint references:
- `GET /api/organization-types`
- `DELETE /api/organization-types`

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| List data | TanStack Query | Query key `['organization-types', queryState]`. |
| Search/page/limit/sort state | `useListQueryState` | Reset page to `1` when search, limit, or sort changes. |
| Checked ids on list | Local React state | Do not store in Redux while merely checking rows. |
| Checked ids for update handoff | Redux Toolkit | Store under dedicated key `organization_type_checked` right before navigating to update page. |
| Delete confirm popup state | Local React state | Open only when selected ids exist. |
| Context menu open/position | `ContextMenu` local state | Shared component owns menu mechanics. |

## Table Layout
Columns:

| Column | Source | Notes |
| --- | --- | --- |
| checkbox | local selection | Header checkbox checks all visible rows; if all visible rows are checked, clicking removes all visible rows from selection. |
| `name` | API data | Primary text. |
| `description` | API data | Render `-` when null. |
| `createdAt` | API data | Localized display. |
| `updatedAt` | API data | Localized display. |

Sortable columns:
- `name`
- `createdAt`
- `updatedAt`

Non-sortable columns:
- checkbox
- `description`

Sort behavior:
- Sortable headers use shared `SortableTableHeader`.
- Ascending state shows the up caret icon active.
- Descending state shows the down caret icon active.
- Clicking the active sortable header toggles `asc`/`desc`.
- Clicking a different sortable header changes `sortBy` and starts with `asc`.
- Sorting resets `page` to `1`.
- The table `thead` stays sticky at the top of the scroll container during vertical scroll.
- The list query calls `useOrganizationTypesQuery({ page, limit, sortBy, sortOrder, search: useDebounce(search, 500) })`.
- Do not recreate the shared list query state handlers inside this page.

Loading and empty states must render inside valid table structure:

```tsx
<tbody>
  {isLoading && <tr><td colSpan={5}><LoadingState /></td></tr>}
  {!isLoading && items.length === 0 && <tr><td colSpan={5}><EmptyState /></td></tr>}
  {items.map(...)}
</tbody>
```

## Context Menu
Open source:
- `onContextMenu` on the table container.

Items:

| Key | Label | Enabled When | Behavior |
| --- | --- | --- | --- |
| `create` | Create | always | Navigate to `/organizations/types/create`. |
| `update` | Update | at least one id checked | Dispatch `{ field: 'organization_type_checked', value: checkedIds }`, then navigate to `/organizations/types/update`. |
| `delete` | Delete | at least one id checked | Open delete confirmation popup. |

## Delete Flow
```text
User checks rows
    ↓
User right-clicks table and selects Delete
    ↓
ConfirmDialog opens
    ↓
User confirms
    ↓
DELETE /api/organization-types with { ids }
    ↓
Invalidate ['organization-types']
    ↓
Clear local checked ids
```

## Loading State
- Query loading renders `LoadingState` inside table body.
- Delete mutation pending disables context menu delete action and confirm buttons.
- Delete confirmation uses shared `ConfirmDialog`; the dialog can be dragged by its header area and closes on outside click when no mutation is pending.

## Toolbar
- The toolbar uses shared `SearchAndFilterBar`.
- The toolbar includes a limit selector using shared options `10`, `20`, `50`, and `100`.
- Changing limit resets `page` to `1` and updates the list query.

## Empty State
- Empty list renders `EmptyState`.
- Create remains available from toolbar and context menu.

## Error State
- Query error renders `ErrorState` with retry.
- Delete mutation error renders inside the confirm dialog.
- Do not expose raw backend error objects.

## Success State
- Delete success shows top-right toast.
- List query invalidates after delete success.

## Validation
- Frontend must not call update/delete with an empty `ids` array.
- API remains final validation boundary for UUID shape and not-found rows.

## Ambiguities
None.
