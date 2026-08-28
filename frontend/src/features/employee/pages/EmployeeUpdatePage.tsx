import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';
import { z } from 'zod';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ContextMenu } from '../../../shared/components/ContextMenu';
import { EmptyState, LoadingState } from '../../../shared/components/PageStates';
import { RequiredHeader } from '../../../shared/components/RequiredHeader';
import { normalizeApiError } from '../../../shared/api/api-error';
import { useApplyApiFieldErrors } from '../../../shared/hooks/useApiFieldErrors';
import { useGridInputNavigation } from '../../../shared/hooks/useGridInputNavigation';
import type { RootState } from '../../../store';
import { clearEmployeeCheckedIds } from '../../../store/employeeSelection/employeeSelectionSlice';
import { employeeApiService } from '../services/employee.api';
import { organizationApiService } from '../../organization/services/organization.api';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_VALUES } from '../types/employee.types';

const employeeBulkUpdateSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      employeeCode: z.string().trim().min(1, 'Employee code is required'),
      firstName: z.string().trim().min(1, 'First name is required'),
      lastName: z.string().trim().min(1, 'Last name is required'),
      email: z.string().trim().email('Enter a valid email'),
      phone: z.string().optional().or(z.literal('')),
      position: z.string().optional().or(z.literal('')),
      status: z.enum(EMPLOYEE_STATUS_VALUES),
      organizationId: z.number().nullable(),
    }),
  ).min(1),
});

type EmployeeBulkUpdateFormValues = z.infer<typeof employeeBulkUpdateSchema>;

export function EmployeeUpdatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedIds = useSelector((state: RootState) => state.employeeSelection.value);
  const { getGridInputProps } = useGridInputNavigation({ gridName: 'employee-update' });
  const organizationsQuery = useQuery({ queryKey: ['organizations'], queryFn: () => organizationApiService.list() });
  const [pendingPayload, setPendingPayload] = useState<{ items: Array<{ id: string; employeeCode?: string; firstName?: string; lastName?: string; email?: string; phone?: string | null; position?: string | null; status?: (typeof EMPLOYEE_STATUS_VALUES)[number]; organizationId?: number | null }> } | null>(null);
  const [checkedRows, setCheckedRows] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, register, handleSubmit, reset, formState: { errors, isValid }, setError } = useForm<EmployeeBulkUpdateFormValues>({
    resolver: zodResolver(employeeBulkUpdateSchema),
    mode: 'onChange',
    defaultValues: { items: [] },
  });
  const applyFieldErrors = useApplyApiFieldErrors(setError);
  const { fields, remove } = useFieldArray({ control, name: 'items' });
  const allChecked = fields.length > 0 && fields.every((field) => checkedRows.includes(field.id));

  useEffect(() => {
    if (selectedIds.length === 0) {
      return;
    }
    employeeApiService.findByIds({ ids: selectedIds }).then((employees) => {
      reset({
        items: employees.map((employee) => ({
          id: employee.id,
          employeeCode: employee.employeeCode ?? '',
          firstName: employee.firstName ?? '',
          lastName: employee.lastName ?? '',
          email: employee.email ?? '',
          phone: employee.phone ?? '',
          position: employee.position ?? '',
          status: employee.status ?? 'ACTIVE',
          organizationId: employee.organizationId ?? null,
        })),
      });
    }).catch((error) => {
      setErrorMessage((error as Error).message || 'Unable to load selected employees.');
    });
  }, [reset, selectedIds]);

  const organizationOptions = (organizationsQuery.data ?? []).map((organization) => ({ value: organization.id, label: organization.name }));

  function toggleAllRows() {
    setCheckedRows(allChecked ? [] : fields.map((field) => field.id));
  }

  function toggleRow(rowId: string) {
    setCheckedRows((current) => current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId]);
  }

  function deleteCheckedRows() {
    const indexes = fields.map((field, index) => ({ field, index })).filter(({ field }) => checkedRows.includes(field.id)).map(({ index }) => index).reverse();
    remove(indexes);
    setCheckedRows([]);
  }

  function onValid(values: EmployeeBulkUpdateFormValues) {
    setErrorMessage(null);
    setPendingPayload({
      items: values.items.map((row) => ({
        id: row.id,
        employeeCode: row.employeeCode.trim(),
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        email: row.email.trim(),
        phone: row.phone?.trim() || null,
        position: row.position?.trim() || null,
        status: row.status,
        organizationId: row.organizationId,
      })),
    });
  }

  async function handleConfirmSubmit() {
    if (!pendingPayload) {
      return;
    }
    try {
      await employeeApiService.bulkUpdate(pendingPayload);
      dispatch(clearEmployeeCheckedIds());
      toast.success('Employees updated successfully.', { position: 'top-right' });
      navigate('/employees');
    } catch (error) {
      const apiError = normalizeApiError(error);
      const message = apiError.message || 'Unable to update employees.';
      const hasFieldErrors = applyFieldErrors(apiError);
      setErrorMessage(message);
      if (!hasFieldErrors) {
        setError('items', { message });
      }
    }
  }

  if (selectedIds.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <EmptyState label="No employees selected for update." />
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/employees')}>Back to list</Button>
      </div>
    );
  }

  if (organizationsQuery.isLoading && fields.length === 0) {
    return <LoadingState label="Loading selected employees..." />;
  }

  return (
    <div>
      <ContextMenu items={[
        { key: 'submit', label: 'Submit', disabled: !isValid || fields.length === 0 || organizationsQuery.isLoading, onSelect: handleSubmit(onValid) },
        { key: 'delete', label: 'Delete', disabled: checkedRows.length === 0 || fields.length <= 1, danger: true, onSelect: deleteCheckedRows },
      ]}>
        {({ onContextMenu }) => (
          <form className="space-y-4" onSubmit={handleSubmit(onValid)} onContextMenu={onContextMenu} noValidate>
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-500">Update selected employee rows.</p>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>Cancel</Button>
                  <Button type="button" onClick={handleSubmit(onValid)} disabled={!isValid || organizationsQuery.isLoading}>Submit</Button>
                </div>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Check all rows" checked={allChecked} onChange={toggleAllRows} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Employee Code" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="First Name" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Last Name" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Email" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Phone</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Position</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Status" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Organization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fields.length === 0 && (
                      <tr>
                        <td colSpan={9}><div className="p-6"><LoadingState label="Loading selected employees..." /></div></td>
                      </tr>
                    )}
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="px-4 py-4 align-top"><input type="checkbox" aria-label={`Check row ${index + 1}`} checked={checkedRows.includes(field.id)} onChange={() => toggleRow(field.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></td>
                        <td className="px-4 py-4 align-top"><input type="hidden" {...register(`items.${index}.id` as const)} /><input type="text" aria-label={`Employee code row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.employeeCode` as const)} {...getGridInputProps(index, 1)} />{errors.items?.[index]?.employeeCode && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.items[index]?.employeeCode?.message}</p>}</td>
                        <td className="px-4 py-4 align-top"><input type="text" aria-label={`First name row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.firstName` as const)} {...getGridInputProps(index, 2)} />{errors.items?.[index]?.firstName && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.items[index]?.firstName?.message}</p>}</td>
                        <td className="px-4 py-4 align-top"><input type="text" aria-label={`Last name row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.lastName` as const)} {...getGridInputProps(index, 3)} />{errors.items?.[index]?.lastName && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.items[index]?.lastName?.message}</p>}</td>
                        <td className="px-4 py-4 align-top"><input type="email" aria-label={`Email row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.email` as const)} {...getGridInputProps(index, 4)} />{errors.items?.[index]?.email && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.items[index]?.email?.message}</p>}</td>
                        <td className="px-4 py-4 align-top"><input type="number" aria-label={`Phone row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.phone` as const)} {...getGridInputProps(index, 5)} /></td>
                        <td className="px-4 py-4 align-top"><input type="text" aria-label={`Position row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.position` as const)} {...getGridInputProps(index, 6)} /></td>
                        <td className="px-4 py-4 align-top">
                          <select aria-label={`Status row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.status` as const)} {...getGridInputProps(index, 7)}>
                            {EMPLOYEE_STATUS_VALUES.map((status) => (<option key={status} value={status}>{EMPLOYEE_STATUS_LABELS[status]}</option>))}
                          </select>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <Controller control={control} name={`items.${index}.organizationId` as const} render={({ field }) => (
                            <Select
                              instanceId={`employee-update-org-${index}`}
                              options={organizationOptions}
                              isClearable
                              value={organizationOptions.find((option) => option.value === field.value) ?? null}
                              onChange={(option) => field.onChange(option?.value ?? null)}
                              isLoading={organizationsQuery.isLoading}
                              className="min-w-[180px]"
                              menuPortalTarget={document.body}
                              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                            />
                          )} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </form>
        )}
      </ContextMenu>
      <ConfirmDialog isOpen={Boolean(pendingPayload)} title="Confirm Update Employees" message="Review the rows before saving changes." confirmLabel="Confirm update" isConfirming={false} errorMessage={errorMessage} onConfirm={handleConfirmSubmit} onCancel={() => setPendingPayload(null)} />
    </div>
  );
}
