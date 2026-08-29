---
id: FRONTEND-WORKFLOW-DEFINITION
type: frontend
module: workflow
status: draft
depends_on:
  - FRONTEND-ARCHITECTURE
  - FRONTEND-API-CLIENT
---

# Workflow Definition Pages

## Purpose
Define the workflow definition list, create, and edit screens.

## Routes
| Route | Component | Purpose |
| --- | --- | --- |
| `/workflows` | `WorkflowListPage` | List workflow definitions. |
| `/workflows/create` | `WorkflowCreatePage` | Create a workflow definition. |
| `/workflows/:id/edit` | `WorkflowEditPage` | Edit workflow metadata, form schema, and approval steps. |

## List Behavior
- `WorkflowListPage` uses `useListQueryState` for `search`, `page`, `limit`, `sortBy`, and `sortOrder`.
- The list query passes those values to `useWorkflowsQuery(...)`, which includes them in the TanStack Query key and forwards them to `workflowApiService.list(...)`.
- `workflowApiService.list(...)` calls `GET /api/workflows` with `page`, `limit`, `search`, `status`, `sortBy`, and `sortOrder` params.
- The toolbar uses `SearchAndFilterBar` with create and limit controls.
- Status filtering supports all workflow definition statuses: `DRAFT`, `ACTIVE`, and `ARCHIVED`; changing the filter resets the page to `1`.
- Sortable columns are `name`, `createdAt`, and `updatedAt`.
- The table renders loading/empty states inside `<tbody>` with `colSpan={5}`.
- The table work area uses `h-[calc(100vh-290px)] overflow-auto`, and `thead` is sticky within that scroll container.
- Pagination uses the backend response `meta.page`, `meta.limit`, and `meta.total` when available.

## Create And Edit Behavior
- The definition form edits `code`, `name`, `description`, `status`, and `formSchema.fields`.
- `WorkflowCreatePage` and `WorkflowEditPage` author Form Schema and Approval Steps with table-style multi-row editors matching the Employee bulk editor pattern.
- The create-page Form Schema table has row checkboxes, required headers for key/label/type, row add/delete actions, context-menu actions, React Hook Form field arrays, Zod validation, shared `useGridInputNavigation`, and API `fieldErrors` mapping through `useApplyApiFieldErrors`.
- The create-page Approval Steps table has row checkboxes, required headers for step name/organization type, row add/delete actions, context-menu actions, React Hook Form field arrays, Zod validation, shared `useGridInputNavigation`, and organization type options fetched once from `GET /api/organization-types`.
- The edit-page Form Schema and Approval Steps tables use the same layout and controls as create, reset from workflow detail, and save through `PUT /api/workflows/:id` plus `POST /api/workflows/:id/steps`.
- `FormSchemaBuilder` remains a reusable component for workflow definition form-schema editing where a compact card editor is acceptable.
- `WorkflowStepBuilder` remains a reusable component for workflow step-chain editing where a compact card editor is acceptable.
- `WorkflowFlow` previews the approval chain with React Flow; coordinates are never persisted.
- Organization type options are fetched once from `GET /api/organization-types` and reused by all step rows.
- Saving a definition writes metadata/schema first, then calls `POST /api/workflows/:id/steps` through `workflowApiService.replaceSteps(...)`.
- The replace-steps request sends `{ steps: [{ name, organizationTypeId }] }`; the client does not persist React Flow coordinates.
- The edit page is a workflow-definition editor and must not render `DynamicFormRenderer`; that renderer belongs to request submission.
- Create/Edit use viewport-relative table heights (`h-[calc(100vh-360px)]` for Form Schema and `h-[calc(100vh-430px)]` for Approval Steps) so large row sets scroll inside fixed work areas.

## State Ownership
| State | Owner |
| --- | --- |
| Workflow list/detail | TanStack Query |
| Organization type options | TanStack Query |
| Definition form fields | React Hook Form |
| Draft approval steps | Local React state |
| Create-page form schema rows | React Hook Form `useFieldArray` |
| Create-page approval step rows | React Hook Form `useFieldArray` |
| Checked table rows | Local React state |
| Flow preview nodes/edges | Derived render state |

## Errors
- API failures are normalized by the shared Axios client.
- Create-page server `fieldErrors` are mapped through `useApplyApiFieldErrors`; field paths under `formSchema.fields.*` map back to `fields.*`, and `steps.*` paths map back to the step table.
- `WORKFLOW_HAS_ACTIVE_REQUESTS` from replace-steps means the chain cannot be rewired while requests are in flight.

## Verification
- `npm run build` in `frontend/` must pass after changes.
