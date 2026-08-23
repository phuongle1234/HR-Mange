import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useEmployeeQuery } from '../hooks/useEmployeeQuery';
import { useDeleteEmployeeMutation } from '../hooks/useDeleteEmployeeMutation';
import { isValidEmployeeId } from '../utils/validate-employee-id';
import { Button } from '../../../shared/components/Button';
import { ErrorState, LoadingState } from '../../../shared/components/PageStates';
import { StatusBadge } from '../components/StatusBadge';
import { DeleteEmployeeDialog } from '../components/DeleteEmployeeDialog';
import type { FrontendApiError } from '../../../shared/api/api-error';

function InfoTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmError, setDeleteConfirmError] = useState<string | null>(null);

  const employeeQuery = useEmployeeQuery(id);
  const deleteEmployeeMutation = useDeleteEmployeeMutation();

  if (!isValidEmployeeId(id)) {
    return <ErrorState message="This employee could not be found." />;
  }

  function handleRequestDelete() {
    setDeleteConfirmError(null);
    setIsDeleteOpen(true);
  }

  function handleCancelDelete() {
    if (deleteEmployeeMutation.isPending) {
      return;
    }
    setIsDeleteOpen(false);
  }

  async function handleConfirmDelete() {
    if (!id) {
      return;
    }
    try {
      await deleteEmployeeMutation.mutateAsync(id);
      toast.success('Employee deleted successfully.', { position: 'top-right' });
      setIsDeleteOpen(false);
      navigate('/employees');
    } catch (error) {
      setDeleteConfirmError((error as FrontendApiError).message);
    }
  }

  if (employeeQuery.isLoading) {
    return <LoadingState label="Loading employee…" />;
  }

  if (employeeQuery.isError) {
    const error = employeeQuery.error as FrontendApiError;
    if (error.code === 'EMPLOYEE_NOT_FOUND') {
      return (
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Employee not found.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/employees')}>
            Back to list
          </Button>
        </div>
      );
    }
    return (
      <ErrorState
        message="Unable to load this employee. Please try again."
        onRetry={() => employeeQuery.refetch()}
      />
    );
  }

  const employee = employeeQuery.data;
  if (!employee) {
    return <LoadingState />;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate(`/employees/${employee.id}/edit`)}>
          Edit
        </Button>
        <Button variant="danger" onClick={handleRequestDelete}>
          Delete
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-black text-slate-950">Employee Information</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <InfoTile label="Employee code" value={employee.employeeCode} />
          <InfoTile label="Full name" value={`${employee.firstName} ${employee.lastName}`} />
          <InfoTile label="Status" value={<StatusBadge status={employee.status} />} />
          <InfoTile label="Email" value={employee.email} />
          <InfoTile label="Phone" value={employee.phone ?? '—'} />
          <InfoTile label="Position" value={employee.position ?? '—'} />
        </div>
      </div>

      <DeleteEmployeeDialog
        isOpen={isDeleteOpen}
        isDeleting={deleteEmployeeMutation.isPending}
        errorMessage={deleteConfirmError}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
