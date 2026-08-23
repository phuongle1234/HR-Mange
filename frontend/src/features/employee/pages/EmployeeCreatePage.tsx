import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  DEFAULT_EMPLOYEE_CREATE_VALUES,
  employeeCreateSchema,
  type EmployeeCreateFormValues,
} from '../schemas/employee.schemas';
import { useCreateEmployeeMutation } from '../hooks/useCreateEmployeeMutation';
import { buildCreateEmployeePayload } from '../utils/build-employee-payload';
import { mapEmployeeFormError } from '../utils/map-employee-error';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_VALUES } from '../types/employee.types';
import type { CreateEmployeePayload } from '../types/employee.types';
import { TextField } from '../../../shared/components/TextField';
import { SelectField } from '../../../shared/components/SelectField';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog, ReviewRow } from '../../../shared/components/ConfirmDialog';
import type { FrontendApiError } from '../../../shared/api/api-error';

const STATUS_OPTIONS = EMPLOYEE_STATUS_VALUES.map((status) => ({
  value: status,
  label: EMPLOYEE_STATUS_LABELS[status],
}));

export function EmployeeCreatePage() {
  const navigate = useNavigate();
  const createEmployeeMutation = useCreateEmployeeMutation();

  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [pendingSubmitPayload, setPendingSubmitPayload] = useState<CreateEmployeePayload | null>(
    null,
  );
  const [submitConfirmError, setSubmitConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<EmployeeCreateFormValues>({
    resolver: zodResolver(employeeCreateSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_EMPLOYEE_CREATE_VALUES,
  });

  function onValid(values: EmployeeCreateFormValues) {
    setFormError(null);
    setSubmitConfirmError(null);
    setPendingSubmitPayload(buildCreateEmployeePayload(values));
    setIsSubmitConfirmOpen(true);
  }

  function handleCloseSubmitConfirm() {
    if (createEmployeeMutation.isPending) {
      return;
    }
    setIsSubmitConfirmOpen(false);
    setSubmitConfirmError(null);
  }

  async function handleConfirmSubmit() {
    if (!pendingSubmitPayload) {
      return;
    }

    try {
      const createdEmployee = await createEmployeeMutation.mutateAsync(pendingSubmitPayload);
      toast.success('Employee created successfully.', { position: 'top-right' });
      setIsSubmitConfirmOpen(false);
      setPendingSubmitPayload(null);
      navigate(`/employees/${createdEmployee.id}`);
    } catch (err) {
      const error = err as FrontendApiError;
      const { formMessage, firstField } = mapEmployeeFormError(error, setError);

      if (firstField) {
        setIsSubmitConfirmOpen(false);
        setPendingSubmitPayload(null);
        setFocus(firstField as keyof EmployeeCreateFormValues);
        return;
      }

      setSubmitConfirmError(formMessage);
    }
  }

  function handleCancel() {
    if (isDirty && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    navigate('/employees');
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-black text-slate-950">Organization Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Position"
              error={errors.position?.message}
              {...register('position')}
            />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
        {formError && (
          <p role="alert" className="text-right text-sm font-semibold text-danger-600">
            {formError}
          </p>
        )}
      </form>

      <ConfirmDialog
        isOpen={isSubmitConfirmOpen}
        title="Confirm Create Employee"
        message="Please review the employee information before creating this employee."
        confirmLabel="Confirm submit"
        isConfirming={createEmployeeMutation.isPending}
        errorMessage={submitConfirmError}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCloseSubmitConfirm}
      >
        {pendingSubmitPayload && (
          <>
            <ReviewRow
              label="Full name"
              value={`${pendingSubmitPayload.firstName} ${pendingSubmitPayload.lastName}`}
            />
            <ReviewRow label="Email" value={pendingSubmitPayload.email} />
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
