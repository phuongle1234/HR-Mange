import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ContextMenu } from '../../../shared/components/ContextMenu';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/PageStates';
import { Pagination } from '../../../shared/components/Pagination';
import { SearchAndFilterBar } from '../../../shared/components/SearchAndFilterBar';
import { SortableTableHeader } from '../../../shared/components/SortableTableHeader';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useListQueryState } from '../../../shared/hooks/useListQueryState';
import { setOrganizationTypeCheckedIds } from '../../../store/organizationTypeSelection/organizationTypeSelectionSlice';
import type { FrontendApiError } from '../../../shared/api/api-error';
import { useDeleteOrganizationTypesMutation } from '../hooks/useDeleteOrganizationTypesMutation';
import { useOrganizationTypesQuery } from '../hooks/useOrganizationTypesQuery';
import type { OrganizationType, OrganizationTypeListQueryState } from '../types/organization-type.types';

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;
type OrganizationTypeSortField = OrganizationTypeListQueryState['sortBy'];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function OrganizationTypeListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { search, page, limit, sortBy, sortOrder, setPage, handleSearchChange, handleLimitChange, handleSortChange } = useListQueryState<OrganizationTypeSortField>({ defaultLimit: DEFAULT_PAGE_SIZE, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmError, setDeleteConfirmError] = useState<string | null>(null);
  const organizationTypesQuery = useOrganizationTypesQuery({ page, limit, sortBy, sortOrder, search: useDebounce(search, SEARCH_DEBOUNCE_MS) });
  const deleteMutation = useDeleteOrganizationTypesMutation();

  const items = organizationTypesQuery.data?.items ?? [];
  const meta = organizationTypesQuery.data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const visibleIds = items.map((item) => item.id);
  const allVisibleChecked = visibleIds.length > 0 && visibleIds.every((id) => checkedIds.includes(id));

  function toggleAllVisible() {
    if (allVisibleChecked) {
      setCheckedIds((current) => current.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setCheckedIds((current) => Array.from(new Set([...current, ...visibleIds])));
  }

  function toggleRow(item: OrganizationType) {
    setCheckedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]);
  }

  function handleUpdateSelected() {
    if (checkedIds.length === 0) {
      return;
    }
    dispatch(setOrganizationTypeCheckedIds(checkedIds));
    navigate('/organizations/types/update');
  }

  function handleCancelDelete() {
    if (deleteMutation.isPending) {
      return;
    }
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmError(null);
  }

  async function handleConfirmDelete() {
    try {
      await deleteMutation.mutateAsync({ ids: checkedIds });
      toast.success('Organization types deleted successfully.', { position: 'top-right' });
      setCheckedIds([]);
      setIsDeleteConfirmOpen(false);
      setDeleteConfirmError(null);
    } catch (error) {
      setDeleteConfirmError((error as FrontendApiError).message);
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">Search, select, and manage organization type records.</p>
      <ContextMenu items={[{ key: 'create', label: 'Create', onSelect: () => navigate('/organizations/types/create') }, { key: 'update', label: 'Update', disabled: checkedIds.length === 0, onSelect: handleUpdateSelected }, { key: 'delete', label: 'Delete', disabled: checkedIds.length === 0 || deleteMutation.isPending, danger: true, onSelect: () => setIsDeleteConfirmOpen(true) }]}>
        {({ onContextMenu }) => (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" onContextMenu={onContextMenu}>
            <SearchAndFilterBar searchValue={search} onSearchChange={handleSearchChange} searchPlaceholder="Search by name or description" createLabel="Create Type" onCreate={() => navigate('/organizations/types/create')} limitValue={limit} onLimitChange={handleLimitChange} />
            {organizationTypesQuery.isError && <ErrorState message="Unable to load organization types. Please try again." onRetry={() => organizationTypesQuery.refetch()} />}
            <div className="h-[calc(100vh-290px)] overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                  <tr>
                    <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Check all organization types" checked={allVisibleChecked} onChange={toggleAllVisible} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></th>
                    <th className="px-4 py-3"><SortableTableHeader field="name" label="Name" activeField={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} /></th>
                    <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Description</th>
                    <th className="px-4 py-3"><SortableTableHeader field="createdAt" label="Created" activeField={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} /></th>
                    <th className="px-4 py-3"><SortableTableHeader field="updatedAt" label="Updated" activeField={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {organizationTypesQuery.isLoading && <tr><td colSpan={5}><LoadingState label="Loading organization types..." /></td></tr>}
                  {!organizationTypesQuery.isLoading && organizationTypesQuery.isSuccess && items.length === 0 && <tr><td colSpan={5}><EmptyState label="No organization types found." /></td></tr>}
                  {!organizationTypesQuery.isLoading && organizationTypesQuery.isSuccess && items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4"><input type="checkbox" aria-label={`Check ${item.name}`} checked={checkedIds.includes(item.id)} onChange={() => toggleRow(item)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></td>
                      <td className="px-4 py-4 text-sm font-black text-slate-950">{item.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{item.description ?? '-'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{formatDate(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={meta?.page || 1} totalPages={totalPages} total={meta?.total || 0} limit={meta?.limit || limit} itemLabel="organization types" onPageChange={(nextPage) => setPage(nextPage)} />
          </div>
        )}
      </ContextMenu>
      <ConfirmDialog isOpen={isDeleteConfirmOpen} title="Delete Organization Types" message={`Delete ${checkedIds.length} selected organization type${checkedIds.length === 1 ? '' : 's'}?`} confirmLabel="Confirm delete" confirmVariant="danger" isConfirming={deleteMutation.isPending} errorMessage={deleteConfirmError} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </div>
  );
}
