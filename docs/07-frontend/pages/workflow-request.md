---
id: FRONTEND-WORKFLOW-REQUEST
type: frontend
module: workflow
status: draft
depends_on:
  - FRONTEND-ARCHITECTURE
  - FRONTEND-API-CLIENT
---

# Workflow Request Pages

## Purpose
Define workflow request submission, request lists, reviewer inbox, request detail, history, and action behavior.

## Routes
| Route | Component | Purpose |
| --- | --- | --- |
| `/workflow-requests/new` | `WorkflowRequestSubmitPage` | Submit an active workflow request. |
| `/workflow-requests` | `MyRequestsPage` | List requests owned by the current user. |
| `/workflow-requests/inbox` | `ReviewerInboxPage` | List requests awaiting review. |
| `/workflow-requests/:id` | `WorkflowRequestDetailPage` | Show request data, history, and allowed actions. |

## Submit Behavior
- The user selects an `ACTIVE` workflow.
- `WorkflowRequestSubmitPage` fetches active workflows through `useWorkflowsQuery({ page: 1, limit: 100, status: 'ACTIVE', sortBy: 'name', sortOrder: 'asc' })`.
- The **Choose workflow** control uses `react-select` with search enabled, clear support, loading state, and a Material UI styled row where the label and select sit on the same horizontal line at desktop widths.
- `DynamicFormRenderer` renders `workflow.formSchema.fields`.
- `DynamicFormRenderer` uses a 12-column grid: `textarea` fields span all 12 columns, while all other field types span 3 columns on desktop and 12 columns on small screens.
- `DynamicFormRenderer` sorts the provided `fields` array before rendering so `textarea` fields appear after the smaller 3-column fields; this intentionally uses the current `fields.sort((a, b) => ...)` implementation.
- Required dynamic fields render the shared required marker beside the field label.
- Submit calls `POST /api/workflow-requests` with `{ workflowId, formData }`.

## List Behavior
- `/workflow-requests` (`MyRequestsPage`) and `/workflow-requests/inbox` (`ReviewerInboxPage`) use the shared list primitives: `useListQueryState`, `SearchAndFilterBar`, `SortableTableHeader`, `Pagination`, and `PageStates`.
- Both pages debounce search input by 500 ms before passing it into `useWorkflowRequestListQuery(...)`.
- Both pages include a status filter using `DRAFT`, `IN_PROGRESS`, `NEEDS_REVISION`, `APPROVED`, `REJECTED`, and `CANCELLED`; changing status resets the page to `1`.
- Query params passed to the API include `scope`, `page`, `limit`, `search`, `status`, `sortBy`, and `sortOrder`.
- Sortable columns are `status`, `submittedAt`, and `updatedAt`.
- The table work area uses `h-[calc(100vh-290px)] overflow-auto`.
- Table headers are sticky inside the scroll container.
- Loading and empty states render inside `<tbody>` with `colSpan={4}`.
- Pagination uses backend `meta.page`, `meta.limit`, and `meta.total` when available and renders a list-specific summary.

## Detail And Actions
- `WorkflowRequestDetailPage` shows submitted form data and `WorkflowHistoryTimeline`.
- `WorkflowActionBar` is driven only by server-provided `permissions`.
- Permission field names are `canApprove`, `canFeedback`, `canReject`, `canCancel`, and `canResubmit`.
- Every action sends the latest `revision` read from request detail.
- `feedback` and `reject` require a comment before the API call.
- `resubmit` sends both `revision` and `formData`.
- `409 WORKFLOW_REQUEST_STALE` triggers a detail refetch and keeps the user on the current screen with the latest state.

## State Ownership
| State | Owner |
| --- | --- |
| Request list/detail/history | TanStack Query |
| Comment dialog state | Local React state |
| Action permissions | Backend response |

## Verification
- `npm run build` in `frontend/` must pass after changes.
