import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { employeeEditSchema, type EmployeeEditFormValues } from '../schemas/employee.schemas';
import { useEmployeeQuery } from '../hooks/useEmployeeQuery';
import { useUpdateEmployeeMutation } from '../hooks/useUpdateEmployeeMutation';
import { buildUpdateEmployeePayload } from '../utils/build-employee-payload';
import { mapEmployeeFormError } from '../utils/map-employee-error';
import {
  buildChangedFieldsReview,
  mapEmployeeToFormValues,
  type ChangedFieldReview,
} from '../utils/employee-form-mapping';
import { isValidEmployeeId } from '../utils/validate-employee-id';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_VALUES } from '../types/employee.types';
import type { UpdateEmployeePayload } from '../types/employee.types';
import { TextField } from '../../../shared/components/TextField';
import { SelectField } from '../../../shared/components/SelectField';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog, ReviewRow } from '../../../shared/components/ConfirmDialog';
import { ErrorState, LoadingState } from '../../../shared/components/PageStates';
import type { FrontendApiError } from '../../../shared/api/api-error';

const STATUS_OPTIONS = EMPLOYEE_STATUS_VALUES.map((status) => ({
  value: status,
  label: EMPLOYEE_STATUS_LABELS[status],
}));

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const employeeQuery = useEmployeeQuery(id);
  const updateEmployeeMutation = useUpdateEmployeeMutation();

  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<UpdateEmployeePayload | null>(
    null,
  );
  const [changedFieldsReview, setChangedFieldsReview] = useState<ChangedFieldReview[]>([]);
  const [submitConfirmError, setSubmitConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [noChangeMessage, setNoChangeMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, dirtyFields },
  } = useForm<EmployeeEditFormValues>({
    resolver: zodResolver(employeeEditSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (employeeQuery.data) {
      reset(mapEmployeeToFormValues(employeeQuery.data));
    }
  }, [employeeQuery.data, reset]);

  if (!isValidEmployeeId(id)) {
    return <ErrorState message="This employee could not be found." />;
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

  if (!employeeQuery.data) {
    return <LoadingState />;
  }

  // A stable, non-undefined binding so closures below don't lose the narrowing.
  const employee = employeeQuery.data;

  function onValid(values: EmployeeEditFormValues) {
    setFormError(null);
    setSubmitConfirmError(null);
    setNoChangeMessage(null);

    const payload = buildUpdateEmployeePayload(values, dirtyFields);
    if (Object.keys(payload).length === 0) {
      setNoChangeMessage('No changes to save.');
      return;
    }

    setPendingUpdatePayload(payload);
    setChangedFieldsReview(buildChangedFieldsReview(payload, employee));
    setIsSubmitConfirmOpen(true);
  }

  function handleCloseSubmitConfirm() {
    if (updateEmployeeMutation.isPending) {
      return;
    }
    setIsSubmitConfirmOpen(false);
    setSubmitConfirmError(null);
  }

  async function handleConfirmUpdate() {
    if (!id || !pendingUpdatePayload) {
      return;
    }

    try {
      await updateEmployeeMutation.mutateAsync({ id, payload: pendingUpdatePayload });
      toast.success('Employee updated successfully.', { position: 'top-right' });
      setIsSubmitConfirmOpen(false);
      setPendingUpdatePayload(null);
      setChangedFieldsReview([]);
      navigate(`/employees/${id}`);
    } catch (err) {
      const error = err as FrontendApiError;
      const { formMessage, firstField } = mapEmployeeFormError(error, setError);

      if (firstField) {
        setIsSubmitConfirmOpen(false);
        setPendingUpdatePayload(null);
        setFocus(firstField as keyof EmployeeEditFormValues);
        return;
      }

      setSubmitConfirmError(formMessage);
    }
  }

  function handleCancel() {
    navigate(`/employees/${id}`);
  }

  return (
    <div>
      <form className="space-y-4" onSubmit={handleSubmit(onValid)} noValidate>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-black text-slate-950">Basic Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Employee code"
              error={errors.employeeCode?.message}
              {...register('employeeCode')}
            />
            <SelectField
              label="Status"
              options={STATUS_OPTIONS}
              error={errors.status?.message}
              {...register('status')}
            />
            <TextField
              label="First name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <TextField
              label="Last name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-black text-slate-950">Contact Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField label="Phone" error={errors.phone?.message} {...register('phone')} />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
        {noChangeMessage && (
          <p className="text-right text-sm font-semibold text-slate-500">{noChangeMessage}</p>
        )}
        {formError && (
          <p role="alert" className="text-right text-sm font-semibold text-danger-600">
            {formError}
          </p>
        )}
      </form>

      <ConfirmDialog
        isOpen={isSubmitConfirmOpen}
        title="Confirm Update Employee"
        message="Please review the changed fields before updating this employee."
        confirmLabel="Confirm update"
        isConfirming={updateEmployeeMutation.isPending}
        errorMessage={submitConfirmError}
        onConfirm={handleConfirmUpdate}
        onCancel={handleCloseSubmitConfirm}
      >
        {changedFieldsReview.map((row) => (
          <ReviewRow
            key={row.field}
            label={row.label}
            value={`${row.previousValue} -> ${row.nextValue}`}
          />
        ))}
      </ConfirmDialog>
    </div>
  );
}
