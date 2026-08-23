import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useEmployeesQuery } from '../hooks/useEmployeesQuery';
import { useDeleteEmployeeMutation } from '../hooks/useDeleteEmployeeMutation';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { Button } from '../../../shared/components/Button';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/PageStates';
import { StatusBadge } from '../components/StatusBadge';
import { DeleteEmployeeDialog } from '../components/DeleteEmployeeDialog';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_VALUES } from '../types/employee.types';
import type { Employee, EmployeeListQueryState, EmployeeStatus } from '../types/employee.types';
import type { FrontendApiError } from '../../../shared/api/api-error';

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...EMPLOYEE_STATUS_VALUES.map((status) => ({ value: status, label: EMPLOYEE_STATUS_LABELS[status] })),
];

export function EmployeeListPage() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<EmployeeStatus | ''>('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const [selectedDeleteEmployee, setSelectedDeleteEmployee] = useState<Employee | null>(null);
  const [deleteConfirmError, setDeleteConfirmError] = useState<string | null>(null);

  const queryState: EmployeeListQueryState = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      search: debouncedSearch,
      status,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    [page, debouncedSearch, status],
  );

  const employeesQuery = useEmployeesQuery(queryState);
  const deleteEmployeeMutation = useDeleteEmployeeMutation();

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

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

  const employees = employeesQuery.data?.items ?? [];
  const meta = employeesQuery.data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Search, filter, and manage employee records.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_200px]">
            <input
              type="search"
              aria-label="Search employees"
              placeholder="Search by code, name, or email"
              value={searchInput}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={() => navigate('/employees/create')}>Create Employee</Button>
        </div>

        {employeesQuery.isLoading && <LoadingState label="Loading employees…" />}

        {employeesQuery.isError && (
          <ErrorState
            message="Unable to load employees. Please try again."
            onRetry={() => employeesQuery.refetch()}
          />
        )}

        {employeesQuery.isSuccess && employees.length === 0 && (
          <EmptyState label="No employees found." />
        )}

        {employeesQuery.isSuccess && employees.length > 0 && (
          <>
            <div className="h-[calc(100vh-380px)] min-h-[240px] overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">
                      Employee Code
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">
                      Full Name
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">
                      Position
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 text-sm font-black text-slate-950">
                        {employee.employeeCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{employee.email}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{employee.phone ?? '—'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {employee.position ?? '—'}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={employee.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => navigate(`/employees/${employee.id}`)}
                          >
                            Detail
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => navigate(`/employees/${employee.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger-lite"
                            onClick={() => handleRequestDelete(employee)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 p-4 sm:flex-row">
                <p className="text-sm text-slate-500">
                  Showing {(meta.page - 1) * meta.limit + 1}-
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} employees
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={meta.page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-bold text-slate-700">
                    Page {meta.page} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={meta.page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <DeleteEmployeeDialog
        isOpen={Boolean(selectedDeleteEmployee)}
        employeeCode={selectedDeleteEmployee?.employeeCode}
        fullName={
          selectedDeleteEmployee
            ? `${selectedDeleteEmployee.firstName} ${selectedDeleteEmployee.lastName}`
            : undefined
        }
        isDeleting={deleteEmployeeMutation.isPending}
        errorMessage={deleteConfirmError}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
