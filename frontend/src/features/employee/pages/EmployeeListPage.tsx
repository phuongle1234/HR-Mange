import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { useDeleteEmployeeMutation } from '../hooks/useDeleteEmployeeMutation';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useListQueryState } from '../../../shared/hooks/useListQueryState';
import { Button } from '../../../shared/components/Button';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/PageStates';
import { Pagination } from '../../../shared/components/Pagination';
import { SearchAndFilterBar } from '../../../shared/components/SearchAndFilterBar';
import { SortableTableHeader } from '../../../shared/components/SortableTableHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DeleteEmployeeDialog } from '../components/DeleteEmployeeDialog';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_VALUES } from '../types/employee.types';
import type { Employee, EmployeeListQueryState, EmployeeStatus } from '../types/employee.types';
import type { FrontendApiError } from '../../../shared/api/api-error';
import { employeeApiService } from '../services/employee.api';
import { employeeQueryKeys } from '../utils/query-keys';

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;
type EmployeeSortField = EmployeeListQueryState['sortBy'];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...EMPLOYEE_STATUS_VALUES.map((status) => ({ value: status, label: EMPLOYEE_STATUS_LABELS[status] })),
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function EmployeeListPage() {
  const navigate = useNavigate();
  const { search, page, limit, sortBy, sortOrder, setPage, handleSearchChange, handleLimitChange, handleSortChange } = useListQueryState<EmployeeSortField>({ defaultLimit: DEFAULT_PAGE_SIZE, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });
  const [status, setStatus] = useState<EmployeeStatus | ''>('');
  const [selectedDeleteEmployee, setSelectedDeleteEmployee] = useState<Employee | null>(null);
  const [deleteConfirmError, setDeleteConfirmError] = useState<string | null>(null);
  const queryState: EmployeeListQueryState = { page, limit, search: useDebounce(search, SEARCH_DEBOUNCE_MS), status, sortBy, sortOrder };

  const employeesQuery = useQuery({
    queryKey: employeeQueryKeys.list(queryState),
    queryFn: () => employeeApiService.list(queryState),
  });
  const deleteEmployeeMutation = useDeleteEmployeeMutation();
  const employees = employeesQuery.data?.items ?? [];
  const meta = employeesQuery.data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  function handleStatusChange(value: string) {
    setStatus(value as EmployeeStatus | '');
    setPage(1);
  }

  function handleRequestDelete(employee: Employee) {
    setSelectedDeleteEmployee(employee);
    setDeleteConfirmError(null);
  }

  function handleCancelDelete() {
    if (deleteEmployeeMutation.isPending) {
      return;
    }
    setSelectedDeleteEmployee(null);
    setDeleteConfirmError(null);
  }

  async function handleConfirmDelete() {
    if (!selectedDeleteEmployee) {
      return;
    }
    try {
      await deleteEmployeeMutation.mutateAsync(selectedDeleteEmployee.id);
      toast.success('Employee deleted successfully.', { position: 'top-right' });
      setSelectedDeleteEmployee(null);
      setDeleteConfirmError(null);
    } catch (error) {
      setDeleteConfirmError((error as FrontendApiError).message);
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">Search, filter, and manage employee records.</p>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SearchAndFilterBar searchValue={search} onSearchChange={handleSearchChange} searchPlaceholder="Search by code, name, or email" createLabel="Create Employee" onCreate={() => navigate('/employees/create')} limitValue={limit} onLimitChange={handleLimitChange}>
          <select aria-label="Filter by status" value={status} onChange={(event: ChangeEvent<HTMLSelectElement>) => handleStatusChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
            {STATUS_FILTER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </SearchAndFilterBar>
        {employeesQuery.isError && <ErrorState message="Unable to load employees. Please try again." onRetry={() => employeesQuery.refetch()} />}
        <div className="h-[calc(100vh-290px)] overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr>
                <th className="px-4 py-3"><SortableTableHeader field="employeeCode" label="Employee Code" activeField={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} /></th>
                <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Full Name</th>
                <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Email</th>
                <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Phone</th>
                <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Position</th>
                <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Status</th>
                <th className="px-4 py-3"><SortableTableHeader field="createdAt" label="Created" activeField={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} /></th>
                <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeesQuery.isLoading && <tr><td colSpan={8}><LoadingState label="Loading employees..." /></td></tr>}
              {!employeesQuery.isLoading && employeesQuery.isSuccess && employees.length === 0 && <tr><td colSpan={8}><EmptyState label="No employees found." /></td></tr>}
              {!employeesQuery.isLoading && employeesQuery.isSuccess && employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-sm font-black text-slate-950">{employee.employeeCode}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{employee.firstName} {employee.lastName}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{employee.email}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{employee.phone ?? '-'}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{employee.position ?? '-'}</td>
                  <td className="px-4 py-4"><StatusBadge status={employee.status} /></td>
                  <td className="px-4 py-4 text-sm text-slate-700">{formatDate(employee.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => navigate(`/employees/${employee.id}`)}>Detail</Button>
                      <Button variant="secondary" onClick={() => navigate(`/employees/${employee.id}/edit`)}>Edit</Button>
                      <Button variant="danger-lite" onClick={() => handleRequestDelete(employee)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={meta?.page || 1} totalPages={totalPages} total={meta?.total || 0} limit={meta?.limit || limit} onPageChange={(nextPage) => setPage(nextPage)} />
      </div>
      <DeleteEmployeeDialog isOpen={Boolean(selectedDeleteEmployee)} employeeCode={selectedDeleteEmployee?.employeeCode} fullName={selectedDeleteEmployee ? `${selectedDeleteEmployee.firstName} ${selectedDeleteEmployee.lastName}` : undefined} isDeleting={deleteEmployeeMutation.isPending} errorMessage={deleteConfirmError} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </div>
  );
}
