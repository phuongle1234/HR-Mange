import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog, ReviewRow } from '../../../shared/components/ConfirmDialog';
import { ContextMenu } from '../../../shared/components/ContextMenu';
import { FullPageLoadingOverlay } from '../../../shared/components/FullPageLoadingOverlay';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/PageStates';
import { RequiredHeader } from '../../../shared/components/RequiredHeader';
import { useGridInputNavigation } from '../../../shared/hooks/useGridInputNavigation';
import { normalizeApiError, type FrontendApiError } from '../../../shared/api/api-error';
import { useApplyApiFieldErrors } from '../../../shared/hooks/useApiFieldErrors';
import type { RootState } from '../../../store';
import { clearOrganizationTypeCheckedIds } from '../../../store/organizationTypeSelection/organizationTypeSelectionSlice';
import { useOrganizationTypesByIdsQuery } from '../hooks/useOrganizationTypesByIdsQuery';
import { useUpdateOrganizationTypesMutation } from '../hooks/useUpdateOrganizationTypesMutation';
import { organizationTypeUpdateSchema, type OrganizationTypeUpdateFormValues } from '../schemas/organization-type.schema';
import { buildUpdateOrganizationTypesPayload, mapOrganizationTypesToUpdateFormValues } from '../utils/organization-type-form';
import type { UpdateOrganizationTypesPayload } from '../types/organization-type.types';

export function OrganizationTypeUpdatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedIds = useSelector((state: RootState) => state.organizationTypeSelection.value);
  const byIdsQuery = useOrganizationTypesByIdsQuery(selectedIds);
  const updateMutation = useUpdateOrganizationTypesMutation(selectedIds);
  const { getGridInputProps } = useGridInputNavigation({ gridName: 'organization-type-update' });
  const [checkedRows, setCheckedRows] = useState<string[]>([]);
  const [pendingPayload, setPendingPayload] = useState<UpdateOrganizationTypesPayload | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const { control, register, handleSubmit, reset, setError, formState: { errors, isValid } } = useForm<OrganizationTypeUpdateFormValues>({ resolver: zodResolver(organizationTypeUpdateSchema), mode: 'onChange', defaultValues: { items: [] } });
  const applyFieldErrors = useApplyApiFieldErrors(setError);
  const { fields, remove } = useFieldArray({ control, name: 'items' });
  const allChecked = fields.length > 0 && fields.every((field) => checkedRows.includes(field.id));

  useEffect(() => {
    if (byIdsQuery.data) {
      reset(mapOrganizationTypesToUpdateFormValues(byIdsQuery.data));
    }
  }, [byIdsQuery.data, reset]);

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

  function onValid(values: OrganizationTypeUpdateFormValues) {
    setConfirmError(null);
    setPendingPayload(buildUpdateOrganizationTypesPayload(values));
    setIsConfirmOpen(true);
  }

  async function handleConfirmSubmit() {
    if (!pendingPayload) {
      return;
    }
    try {
      await updateMutation.mutateAsync(pendingPayload);
      toast.success('Organization types updated successfully.', { position: 'top-right' });
      dispatch(clearOrganizationTypeCheckedIds());
      navigate('/organizations/types');
    } catch (error) {
      const apiError = normalizeApiError(error);
      applyFieldErrors(apiError);
      setConfirmError(apiError.message);
    }
  }

  if (selectedIds.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <EmptyState label="No organization types selected for update." />
        <Button variant="secondary" onClick={() => navigate('/organizations/types')}>Back to list</Button>
      </div>
    );
  }

  if (byIdsQuery.isLoading) {
    return <LoadingState label="Loading selected organization types..." />;
  }

  if (byIdsQuery.isError) {
    const error = byIdsQuery.error as FrontendApiError;
    return <ErrorState message={error.code === 'ORGANIZATION_TYPE_NOT_FOUND' ? 'One or more selected organization types could not be found.' : 'Unable to load selected organization types.'} onRetry={() => byIdsQuery.refetch()} />;
  }

  return (
    <div>
      <ContextMenu items={[{ key: 'submit', label: 'Submit', disabled: !isValid || fields.length === 0 || updateMutation.isPending, onSelect: handleSubmit(onValid) }, { key: 'delete', label: 'Delete', disabled: checkedRows.length === 0 || fields.length <= 1, danger: true, onSelect: deleteCheckedRows }]}>
        {({ onContextMenu }) => (
          <form className="space-y-4" onSubmit={handleSubmit(onValid)} onContextMenu={onContextMenu} noValidate>
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-500">Update selected organization type rows.</p>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => navigate('/organizations/types')}>Cancel</Button>
                  <Button type="submit" disabled={!isValid || updateMutation.isPending}>Submit</Button>
                </div>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Check all rows" checked={allChecked} onChange={toggleAllRows} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Name" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="px-4 py-4 align-top"><input type="checkbox" aria-label={`Check row ${index + 1}`} checked={checkedRows.includes(field.id)} onChange={() => toggleRow(field.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></td>
                        <td className="px-4 py-4 align-top"><input type="hidden" {...register(`items.${index}.id` as const)} /><input type="text" aria-label={`Name row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`items.${index}.name` as const)} {...getGridInputProps(index, 0)} />{errors.items?.[index]?.name?.message && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.items[index]?.name?.message}</p>}</td>
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
      <ConfirmDialog isOpen={isConfirmOpen} title="Confirm Organization Type Updates" message="Please review the rows before updating organization types." confirmLabel="Confirm update" isConfirming={updateMutation.isPending} errorMessage={confirmError} onConfirm={handleConfirmSubmit} onCancel={() => { if (!updateMutation.isPending) setIsConfirmOpen(false); }}>
        {pendingPayload && <ReviewRow label="Rows" value={pendingPayload.items.length} />}
      </ConfirmDialog>
      <FullPageLoadingOverlay isOpen={updateMutation.isPending} label="Updating organization types..." />
    </div>
  );
}
