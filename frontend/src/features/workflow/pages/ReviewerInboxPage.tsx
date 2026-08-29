import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/PageStates';
import { Pagination } from '../../../shared/components/Pagination';
import { SearchAndFilterBar } from '../../../shared/components/SearchAndFilterBar';
import { SortableTableHeader } from '../../../shared/components/SortableTableHeader';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useListQueryState } from '../../../shared/hooks/useListQueryState';
import { useWorkflowRequestListQuery } from '../hooks/useWorkflowRequestListQuery';
import { WorkflowStatusBadge } from '../components/WorkflowStatusBadge';
import type { WorkflowRequestListQuery, WorkflowRequestStatus } from '../types/workflow.types';

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;
const WORKFLOW_REQUEST_STATUS_OPTIONS: WorkflowRequestStatus[] = ['DRAFT', 'IN_PROGRESS', 'NEEDS_REVISION', 'APPROVED', 'REJECTED', 'CANCELLED'];
type WorkflowRequestSortField = NonNullable<WorkflowRequestListQuery['sortBy']>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function ReviewerInboxPage() {
  const navigate = useNavigate();
  const queryState = useListQueryState<WorkflowRequestSortField>({ defaultLimit: DEFAULT_PAGE_SIZE, defaultSortBy: 'updatedAt', defaultSortOrder: 'desc' });
  const [status, setStatus] = useState<WorkflowRequestStatus | ''>('');
  const requestsQuery = useWorkflowRequestListQuery({ scope: 'inbox', page: queryState.page, limit: queryState.limit, search: useDebounce(queryState.search, SEARCH_DEBOUNCE_MS), status: status || undefined, sortBy: queryState.sortBy, sortOrder: queryState.sortOrder });

  const items = requestsQuery.data?.items ?? [];
  const meta = requestsQuery.data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  function handleStatusChange(value: WorkflowRequestStatus | '') {
    setStatus(value);
    queryState.setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SearchAndFilterBar searchValue={queryState.search} onSearchChange={queryState.handleSearchChange} searchPlaceholder="Search inbox requests" createLabel="New Request" onCreate={() => navigate('/workflow-requests/new')} limitValue={queryState.limit} onLimitChange={queryState.handleLimitChange}>
          <select aria-label="Filter inbox requests by status" value={status} onChange={(event) => handleStatusChange(event.target.value as WorkflowRequestStatus | '')} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
            <option value="">All statuses</option>
            {WORKFLOW_REQUEST_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </SearchAndFilterBar>
        {requestsQuery.isError && <ErrorState message="Unable to load inbox." onRetry={() => requestsQuery.refetch()} />}

        <div className="h-[calc(100vh-290px)] overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr>
                <th className="px-4 py-3"><SortableTableHeader field="status" label="Status" activeField={queryState.sortBy} sortOrder={queryState.sortOrder} onSortChange={queryState.handleSortChange} /></th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3"><SortableTableHeader field="submittedAt" label="Submitted" activeField={queryState.sortBy} sortOrder={queryState.sortOrder} onSortChange={queryState.handleSortChange} /></th>
                <th className="px-4 py-3"><SortableTableHeader field="updatedAt" label="Updated" activeField={queryState.sortBy} sortOrder={queryState.sortOrder} onSortChange={queryState.handleSortChange} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requestsQuery.isLoading && <tr><td colSpan={4}><LoadingState label="Loading inbox..." /></td></tr>}
              {!requestsQuery.isLoading && requestsQuery.isSuccess && items.length === 0 && <tr><td colSpan={4}><EmptyState label="No inbox items." /></td></tr>}
              {!requestsQuery.isLoading && requestsQuery.isSuccess && items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><WorkflowStatusBadge status={item.status} /></td>
                  <td className="px-4 py-3"><button type="button" onClick={() => navigate(`/workflow-requests/${item.id}`)} className="font-black text-brand-700">{item.employeeName ?? 'Request'} - {item.workflow?.name ?? 'Workflow'}</button></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.submittedAt ? formatDate(item.submittedAt) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={meta?.page || queryState.page} totalPages={totalPages} total={meta?.total || 0} limit={meta?.limit || queryState.limit} itemLabel="inbox requests" onPageChange={queryState.setPage} />
      </div>
    </div>
  );
}
