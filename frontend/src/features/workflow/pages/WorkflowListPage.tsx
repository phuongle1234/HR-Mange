import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/PageStates';
import { SearchAndFilterBar } from '../../../shared/components/SearchAndFilterBar';
import { Pagination } from '../../../shared/components/Pagination';
import { SortableTableHeader } from '../../../shared/components/SortableTableHeader';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useListQueryState } from '../../../shared/hooks/useListQueryState';
import { useWorkflowsQuery } from '../hooks/useWorkflowsQuery';
import { WorkflowStatusBadge } from '../components/WorkflowStatusBadge';
import type { WorkflowListQuery, WorkflowStatus } from '../types/workflow.types';

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;
const WORKFLOW_STATUS_OPTIONS: WorkflowStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
type WorkflowSortField = NonNullable<WorkflowListQuery['sortBy']>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function WorkflowListPage() {
  const { search, page, limit, sortBy, sortOrder, setPage, handleSearchChange, handleLimitChange, handleSortChange } = useListQueryState<WorkflowSortField>({
    defaultLimit: DEFAULT_PAGE_SIZE,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });
  const navigate = useNavigate();
  const [status, setStatus] = useState<WorkflowStatus | ''>('');
  const workflowsQuery = useWorkflowsQuery({ page, limit, sortBy, sortOrder, status: status || undefined, search: useDebounce(search, SEARCH_DEBOUNCE_MS) });
  const items = workflowsQuery.data?.items ?? [];
  const meta = workflowsQuery.data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  function handleStatusChange(value: WorkflowStatus | '') {
    setStatus(value);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SearchAndFilterBar searchValue={search} onSearchChange={handleSearchChange} searchPlaceholder="Search workflows" createLabel="New Workflow" onCreate={() => navigate('/workflows/create')} limitValue={limit} onLimitChange={handleLimitChange}>
          <select aria-label="Filter workflows by status" value={status} onChange={(event) => handleStatusChange(event.target.value as WorkflowStatus | '')} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
            <option value="">All statuses</option>
            {WORKFLOW_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </SearchAndFilterBar>
        {workflowsQuery.isError && <ErrorState message="Unable to load workflows." onRetry={() => workflowsQuery.refetch()} />}

        <div className="h-[calc(100vh-290px)] overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr>
                <th className="px-4 py-3"><SortableTableHeader field="name" label="Name" activeField={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} /></th>
                <th className="px-4 py-3"><SortableTableHeader field="createdAt" label="Created" activeField={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} /></th>
                <th className="px-4 py-3"><SortableTableHeader field="updatedAt" label="Updated" activeField={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} /></th>
                <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workflowsQuery.isLoading && <tr><td colSpan={5}><LoadingState label="Loading workflows..." /></td></tr>}
              {!workflowsQuery.isLoading && workflowsQuery.isSuccess && items.length === 0 && <tr><td colSpan={5}><EmptyState label="No workflows found." /></td></tr>}
              {!workflowsQuery.isLoading && workflowsQuery.isSuccess && items.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-900">{workflow.name}</div>
                    <div className="text-xs text-slate-500">{workflow.code}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(workflow.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(workflow.updatedAt)}</td>
                  <td className="px-4 py-3"><WorkflowStatusBadge status={workflow.status} /></td>
                  <td className="px-4 py-3"><Link to={`/workflows/${workflow.id}/edit`} className="font-bold text-brand-700">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={meta?.page || page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
