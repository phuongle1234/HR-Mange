---
id: FRONTEND-ORGANIZATION-TYPE-CREATE
type: frontend
module: organization-type
status: draft
depends_on:
  - API-ORGANIZATION-TYPE-CREATE-MANY
  - FRONTEND-ARCHITECTURE
  - FRONTEND-API-CLIENT
  - FRONTEND-STATE-MANAGEMENT
---

# Organization Type Create

## Purpose
Define the React page behavior for creating one or more organization type rows in a table-form workflow.

## Route Reference
```text
/organizations/types/create -> OrganizationTypeCreatePage
```

Route-level decisions:
- Layout: `AppLayout`.
- Auth guard: required.
- Permission model: none.
- Navbar title: `Create Organization Types`.
- Back target: `/organizations/types`.

## Proposed Files
```text
src/features/organization-type/pages/OrganizationTypeCreatePage.tsx
src/features/organization-type/schemas/organization-type.schema.ts
src/features/organization-type/utils/organization-type-form.ts
src/features/organization-type/hooks/useCreateOrganizationTypesMutation.ts
src/shared/components/ContextMenu.tsx
src/shared/hooks/useGridInputNavigation.ts
src/shared/components/FullPageLoadingOverlay.tsx
src/shared/components/ConfirmDialog.tsx
```

## Responsibilities
This spec owns:
- Render table-form rows for bulk create.
- Use React Hook Form and Zod validation.
- Add/delete editable rows.
- Check all/remove all local rows for deletion.
- Open reusable context menu from right-click.
- Confirm before submitting.
- Submit all rows in one API call.

This spec must not own:
- Database uniqueness enforcement.
- Server state storage in Redux.
- Direct Axios calls.

## API Contract
Service method:

```ts
organizationTypeApiService.createMany({ items })
```

Endpoint:

```text
POST /api/organization-types
```

Request shape:

```ts
{
  items: Array<{
    name: string;
    description?: string | null;
  }>;
}
```

## State Ownership
| State | Owner | Notes |
| --- | --- | --- |
| Form rows and field errors | React Hook Form | Use `useFieldArray`. |
| Checked local row ids | Local React state | Used only to remove rows from the form. |
| Confirm popup state | Local React state | Stores pending submit intent. |
| Mutation pending state | TanStack Mutation | Drives disabled submit and full-page loading overlay. |

## Table Form Layout
Columns:

| Column | Input | Validation |
| --- | --- | --- |
| checkbox | row checkbox | Header checkbox checks all rows; when all rows are checked, clicking removes all checks. |
| `name` | text input | required, max 100, unique within current form rows |
| `description` | text input or textarea | optional, max 1000 |

Validation messages appear below the related input inside the same table cell.

Page action bar:
- `Cancel` navigates back to `/organizations/types`.
- `Add Row` appends one empty editable row.
- `Submit` runs React Hook Form validation and opens the confirm dialog when valid.
- Submit is disabled while the form is invalid or the create mutation is pending.

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
Use shared hook:

```ts
useGridInputNavigation()
```

Behavior:
- ArrowDown moves focus to the same column in the next row.
- ArrowUp moves focus to the same column in the previous row.
- ArrowRight moves focus to the next editable input in the same row.
- ArrowLeft moves focus to the previous editable input in the same row.
- The hook only moves focus. It must not mutate form values.

## Submit Flow
```text
User edits table rows
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
POST /api/organization-types with { items }
    ↓
Invalidate ['organization-types']
    ↓
Redirect to /organizations/types
```

## Loading State
- Submit button disabled while invalid or mutation pending.
- Full-page loading overlay appears after confirmation while mutation is pending.
- Confirm dialog can be dragged by its header area and closes on outside click when the create mutation is not pending.

## Error State
- Field errors render under inputs.
- API field errors for `items[n].name` map to the corresponding row.
- Non-field mutation error renders near the page actions or inside confirmation popup.
- Do not expose raw backend error objects.

## Success State
- Show top-right toast.
- Redirect to `/organizations/types`.
- Invalidate `['organization-types']`.

## Validation
Client Zod schema mirrors API:
- `items`: min 1, max 100.
- `name`: required, trimmed, max 100.
- `description`: optional, trimmed, max 1000, empty string converted to `null`.
- duplicate `name` values in current form produce field-level errors.

## Ambiguities
None.
