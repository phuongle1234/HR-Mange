import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog, ReviewRow } from '../../../shared/components/ConfirmDialog';
import { ContextMenu } from '../../../shared/components/ContextMenu';
import { FullPageLoadingOverlay } from '../../../shared/components/FullPageLoadingOverlay';
import { useGridInputNavigation } from '../../../shared/hooks/useGridInputNavigation';
import type { FrontendApiError } from '../../../shared/api/api-error';
import { useCreateOrganizationTypesMutation } from '../hooks/useCreateOrganizationTypesMutation';
import { DEFAULT_ORGANIZATION_TYPE_CREATE_VALUES, organizationTypeCreateSchema, type OrganizationTypeCreateFormValues } from '../schemas/organization-type.schema';
import { applyOrganizationTypeFieldErrors, buildCreateOrganizationTypesPayload } from '../utils/organization-type-form';
import type { CreateOrganizationTypesPayload } from '../types/organization-type.types';

export function OrganizationTypeCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateOrganizationTypesMutation();
  const { getGridInputProps } = useGridInputNavigation({ gridName: 'organization-type-create' });
  const [checkedRows, setCheckedRows] = useState<string[]>([]);
  const [pendingPayload, setPendingPayload] = useState<CreateOrganizationTypesPayload | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const { control, register, handleSubmit, setError, formState: { errors, isValid } } = useForm<OrganizationTypeCreateFormValues>({ resolver: zodResolver(organizationTypeCreateSchema), mode: 'onChange', defaultValues: DEFAULT_ORGANIZATION_TYPE_CREATE_VALUES });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const allChecked = fields.length > 0 && fields.every((field) => checkedRows.includes(field.id));

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

  function onValid(values: OrganizationTypeCreateFormValues) {
    setConfirmError(null);
    setPendingPayload(buildCreateOrganizationTypesPayload(values));
    setIsConfirmOpen(true);
  }

  async function handleConfirmSubmit() {
    if (!pendingPayload) {
      return;
    }
    try {
      await createMutation.mutateAsync(pendingPayload);
      toast.success('Organization types created successfully.', { position: 'top-right' });
      navigate('/organizations/types');
    } catch (error) {
      const apiError = error as FrontendApiError;
      applyOrganizationTypeFieldErrors(apiError, setError);
      setConfirmError(apiError.message);
    }
  }

  return (
    <div>
      <ContextMenu items={[{ key: 'submit', label: 'Submit', disabled: !isValid || fields.length === 0 || createMutation.isPending, onSelect: handleSubmit(onValid) }, { key: 'create-items', label: 'Create items', onSelect: () => append({ name: '', description: '' }) }, { key: 'delete', label: 'Delete', disabled: checkedRows.length === 0 || fields.length <= 1, danger: true, onSelect: deleteCheckedRows }]}>
        {({ onContextMenu }) => (
          <form className="space-y-4" onSubmit={handleSubmit(onValid)} onContextMenu={onContextMenu} noValidate>
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-500">Create one or more organization type rows.</p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => navigate('/organizations/types')}>Cancel</Button>
                  <Button type="button" variant="secondary" onClick={() => append({ name: '', description: '' })}>Add Row</Button>
                  <Button type="submit" disabled={!isValid || createMutation.isPending}>Submit</Button>
                </div>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Check all rows" checked={allChecked} onChange={toggleAllRows} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Name</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="px-4 py-4 align-top"><input type="checkbox" aria-label={`Check row ${index + 1}`} checked={checkedRows.includes(field.id)} onChange={() => toggleRow(field.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></td>
                        <td className="px-4 py-4 align-top"><input type="text" aria-label={`Name row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.name` as const)} {...getGridInputProps(index, 0)} />{errors.items?.[index]?.name?.message && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.items[index]?.name?.message}</p>}</td>
                        <td className="px-4 py-4 align-top"><input type="text" aria-label={`Description row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.description` as const)} {...getGridInputProps(index, 1)} />{errors.items?.[index]?.description?.message && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.items[index]?.description?.message}</p>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </form>
        )}
      </ContextMenu>
      <ConfirmDialog isOpen={isConfirmOpen} title="Confirm Organization Types" message="Please review the rows before creating organization types." confirmLabel="Confirm submit" isConfirming={createMutation.isPending} errorMessage={confirmError} onConfirm={handleConfirmSubmit} onCancel={() => { if (!createMutation.isPending) setIsConfirmOpen(false); }}>
        {pendingPayload && <ReviewRow label="Rows" value={pendingPayload.items.length} />}
      </ConfirmDialog>
      <FullPageLoadingOverlay isOpen={createMutation.isPending} label="Creating organization types..." />
    </div>
  );
}
