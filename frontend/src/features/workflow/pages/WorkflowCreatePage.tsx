import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ContextMenu } from '../../../shared/components/ContextMenu';
import { RequiredHeader } from '../../../shared/components/RequiredHeader';
import { normalizeApiError } from '../../../shared/api/api-error';
import { useApplyApiFieldErrors } from '../../../shared/hooks/useApiFieldErrors';
import { useGridInputNavigation } from '../../../shared/hooks/useGridInputNavigation';
import { organizationTypeApiService } from '../../organization-type/services/organization-type.api';
import { WorkflowFlow } from '../components/WorkflowFlow';
import { useCreateWorkflowMutation } from '../hooks/useCreateWorkflowMutation';
import { useReplaceWorkflowStepsMutation } from '../hooks/useReplaceWorkflowStepsMutation';
import type { WorkflowFormFieldType, WorkflowStatus, WorkflowStep } from '../types/workflow.types';

const WORKFLOW_FIELD_TYPES: WorkflowFormFieldType[] = ['text', 'textarea', 'number', 'date', 'select', 'checkbox'];
const WORKFLOW_STATUSES: WorkflowStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

const workflowCreateTableSchema = z.object({
  code: z.string().trim().min(1, 'Workflow code is required.'),
  name: z.string().trim().min(1, 'Workflow name is required.'),
  description: z.string().optional(),
  status: z.enum(WORKFLOW_STATUSES),
  fields: z.array(z.object({
    rowId: z.string(),
    key: z.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field key must start with a letter and may use letters, numbers, or underscores.'),
    label: z.string().trim().min(1, 'Field label is required.'),
    type: z.enum(WORKFLOW_FIELD_TYPES),
    required: z.boolean(),
    placeholder: z.string().optional(),
    optionsText: z.string().optional(),
  })).min(1, 'Add at least one form field.').superRefine((fields, context) => {
    const seen = new Map<string, number>();
    fields.forEach((field, index) => {
      const key = field.key.trim().toLowerCase();
      if (seen.has(key)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Field key must be unique within this form.', path: [index, 'key'] });
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Field key must be unique within this form.', path: [seen.get(key) ?? 0, 'key'] });
      }
      seen.set(key, index);
      if (field.type === 'select' && parseOptionsText(field.optionsText).length === 0) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Select fields require at least one option.', path: [index, 'optionsText'] });
      }
    });
  }),
  steps: z.array(z.object({
    rowId: z.string(),
    name: z.string().trim().min(1, 'Step name is required.'),
    organizationTypeId: z.string().trim().min(1, 'Organization type is required.'),
  })).min(1, 'Add at least one approval step.').max(20, 'Workflow can have at most 20 approval steps.'),
});

type WorkflowCreateTableValues = z.infer<typeof workflowCreateTableSchema>;
type WorkflowFieldRow = WorkflowCreateTableValues['fields'][number];
type WorkflowStepRow = WorkflowCreateTableValues['steps'][number];

function parseOptionsText(value?: string) {
  return (value ?? '').split(',').map((item) => item.trim()).filter(Boolean).map((item) => {
    const [label, rawValue] = item.split(':').map((part) => part.trim());
    return { label, value: rawValue || label };
  });
}

function createFieldRow(): WorkflowFieldRow {
  return { rowId: crypto.randomUUID(), key: `field_${Date.now()}`, label: '', type: 'text', required: false, placeholder: '', optionsText: '' };
}

function createStepRow(organizationTypeId = ''): WorkflowStepRow {
  return { rowId: crypto.randomUUID(), name: '', organizationTypeId };
}

function buildStepPreview(steps: WorkflowStepRow[], organizationTypes: Array<{ id: string; name: string }>): WorkflowStep[] {
  return steps.map((step, index) => ({ id: step.rowId, workflowId: '', parentId: index === 0 ? null : steps[index - 1].rowId, name: step.name || `Step ${index + 1}`, organizationTypeId: step.organizationTypeId, organizationTypeName: organizationTypes.find((organizationType) => organizationType.id === step.organizationTypeId)?.name, stepOrder: index + 1 }));
}

export function WorkflowCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateWorkflowMutation();
  const replaceStepsMutation = useReplaceWorkflowStepsMutation();
  const organizationTypesQuery = useQuery({ queryKey: ['organization-types', 'workflow-builder'], queryFn: () => organizationTypeApiService.list({ page: 1, limit: 100, search: '', sortBy: 'name', sortOrder: 'asc' }) });
  const [checkedFieldRows, setCheckedFieldRows] = useState<string[]>([]);
  const [checkedStepRows, setCheckedStepRows] = useState<string[]>([]);
  const [pendingValues, setPendingValues] = useState<WorkflowCreateTableValues | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { getGridInputProps: getFieldGridInputProps } = useGridInputNavigation({ gridName: 'workflow-create-fields' });
  const { getGridInputProps: getStepGridInputProps } = useGridInputNavigation({ gridName: 'workflow-create-steps' });
  const { control, register, handleSubmit, watch, formState: { errors, isValid }, setError } = useForm<WorkflowCreateTableValues>({ resolver: zodResolver(workflowCreateTableSchema), mode: 'onChange', defaultValues: { code: 'LEAVE_REQUEST', name: 'Leave Request', description: 'Approval workflow', status: 'DRAFT', fields: [{ ...createFieldRow(), key: 'leaveType', label: 'Leave Type', type: 'select', required: true, optionsText: 'Annual leave:annual, Sick leave:sick' }, { ...createFieldRow(), key: 'startDate', label: 'Start Date', type: 'date', required: true }], steps: [createStepRow()] } });
  const applyFieldErrors = useApplyApiFieldErrors(setError, { mapFieldPath: (fieldPath) => fieldPath.replace(/^formSchema\.fields\./, 'fields.').replace(/^steps\./, 'steps.') });
  const fieldArray = useFieldArray({ control, name: 'fields', keyName: 'formId' });
  const stepArray = useFieldArray({ control, name: 'steps', keyName: 'formId' });
  const organizationTypes = organizationTypesQuery.data?.items ?? [];
  const watchedSteps = watch('steps');
  const stepPreview = useMemo(() => buildStepPreview(watchedSteps, organizationTypes), [organizationTypes, watchedSteps]);
  const allFieldsChecked = fieldArray.fields.length > 0 && fieldArray.fields.every((field) => checkedFieldRows.includes(field.rowId));
  const allStepsChecked = stepArray.fields.length > 0 && stepArray.fields.every((field) => checkedStepRows.includes(field.rowId));
  const isSaving = createMutation.isPending || replaceStepsMutation.isPending;

  function toggleAllFields() {
    setCheckedFieldRows(allFieldsChecked ? [] : fieldArray.fields.map((field) => field.rowId));
  }

  function toggleAllSteps() {
    setCheckedStepRows(allStepsChecked ? [] : stepArray.fields.map((field) => field.rowId));
  }

  function toggleFieldRow(rowId: string) {
    setCheckedFieldRows((current) => current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId]);
  }

  function toggleStepRow(rowId: string) {
    setCheckedStepRows((current) => current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId]);
  }

  function deleteCheckedFields() {
    const indexes = fieldArray.fields.map((field, index) => ({ field, index })).filter(({ field }) => checkedFieldRows.includes(field.rowId)).map(({ index }) => index).reverse();
    fieldArray.remove(indexes);
    setCheckedFieldRows([]);
  }

  function deleteCheckedSteps() {
    const indexes = stepArray.fields.map((field, index) => ({ field, index })).filter(({ field }) => checkedStepRows.includes(field.rowId)).map(({ index }) => index).reverse();
    stepArray.remove(indexes);
    setCheckedStepRows([]);
  }

  function onValid(values: WorkflowCreateTableValues) {
    setSubmitError(null);
    setPendingValues(values);
  }

  async function handleConfirmSubmit() {
    if (!pendingValues) return;

    try {
      const workflow = await createMutation.mutateAsync({ code: pendingValues.code.trim(), name: pendingValues.name.trim(), description: pendingValues.description?.trim() || null, status: pendingValues.status, formSchema: { fields: pendingValues.fields.map((field) => ({ key: field.key.trim(), label: field.label.trim(), type: field.type, required: field.required, placeholder: field.placeholder?.trim() || undefined, options: field.type === 'select' ? parseOptionsText(field.optionsText) : undefined })) } });
      await replaceStepsMutation.mutateAsync({ id: workflow.id, steps: buildStepPreview(pendingValues.steps, organizationTypes).map((step) => ({ ...step, workflowId: workflow.id })) });
      toast.success('Workflow created successfully.', { position: 'top-right' });
      navigate('/workflows');
    } catch (error) {
      setPendingValues(null);
      const apiError = normalizeApiError(error);
      const hasFieldErrors = applyFieldErrors(apiError);
      setSubmitError(apiError.message || 'Unable to create workflow.');
      if (!hasFieldErrors) {
        setError('root', { message: apiError.message || 'Unable to create workflow.' });
      }
    }
  }

  return (
    <div>
      <ContextMenu items={[{ key: 'submit', label: 'Submit', disabled: !isValid || fieldArray.fields.length === 0 || stepArray.fields.length === 0 || organizationTypesQuery.isLoading, onSelect: handleSubmit(onValid) }, { key: 'add-field', label: 'Add form field', onSelect: () => fieldArray.append(createFieldRow()) }, { key: 'add-step', label: 'Add approval step', disabled: stepArray.fields.length >= 20 || organizationTypes.length === 0, onSelect: () => stepArray.append(createStepRow(organizationTypes[0]?.id ?? '')) }, { key: 'delete-fields', label: 'Delete checked fields', disabled: checkedFieldRows.length === 0 || fieldArray.fields.length <= 1, danger: true, onSelect: deleteCheckedFields }, { key: 'delete-steps', label: 'Delete checked steps', disabled: checkedStepRows.length === 0 || stepArray.fields.length <= 1, danger: true, onSelect: deleteCheckedSteps }]}>
        {({ onContextMenu }) => (
          <form className="space-y-4" onSubmit={handleSubmit(onValid)} onContextMenu={onContextMenu} noValidate>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Code<input {...register('code')} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3" />{errors.code && <p className="mt-1 text-xs font-semibold text-danger-600">{errors.code.message}</p>}</label>
                <label className="text-sm font-medium text-slate-700">Name<input {...register('name')} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3" />{errors.name && <p className="mt-1 text-xs font-semibold text-danger-600">{errors.name.message}</p>}</label>
              </div>
              <label className="mt-4 block text-sm font-medium text-slate-700">Description<textarea {...register('description')} className="mt-1 h-20 w-full rounded-lg border border-slate-200 p-3" /></label>
              <label className="mt-4 block text-sm font-medium text-slate-700">Status<select {...register('status')} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3">{WORKFLOW_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-500">Form Schema</p>
                <Button type="button" variant="secondary" onClick={() => fieldArray.append(createFieldRow())}>Add Field</Button>
              </div>
              <div className="h-[calc(100vh-360px)] min-h-72 overflow-auto">
                <table className="w-full min-w-[1040px] text-left">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Check all form fields" checked={allFieldsChecked} onChange={toggleAllFields} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Key" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Label" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Type" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Required</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Placeholder</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500">Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fieldArray.fields.map((field, index) => (
                      <tr key={field.formId}>
                        <td className="px-4 py-4 align-top"><input type="checkbox" aria-label={`Check form field row ${index + 1}`} checked={checkedFieldRows.includes(field.rowId)} onChange={() => toggleFieldRow(field.rowId)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></td>
                        <td className="px-4 py-4 align-top"><input type="hidden" {...register(`fields.${index}.rowId` as const)} /><input type="text" aria-label={`Field key row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`fields.${index}.key` as const)} {...getFieldGridInputProps(index, 1)} />{errors.fields?.[index]?.key && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.fields[index]?.key?.message}</p>}</td>
                        <td className="px-4 py-4 align-top"><input type="text" aria-label={`Field label row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`fields.${index}.label` as const)} {...getFieldGridInputProps(index, 2)} />{errors.fields?.[index]?.label && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.fields[index]?.label?.message}</p>}</td>
                        <td className="px-4 py-4 align-top"><select aria-label={`Field type row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`fields.${index}.type` as const)} {...getFieldGridInputProps(index, 3)}>{WORKFLOW_FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></td>
                        <td className="px-4 py-4 align-top"><input type="checkbox" aria-label={`Field required row ${index + 1}`} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" {...register(`fields.${index}.required` as const)} /></td>
                        <td className="px-4 py-4 align-top"><input type="text" aria-label={`Field placeholder row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`fields.${index}.placeholder` as const)} {...getFieldGridInputProps(index, 4)} /></td>
                        <td className="px-4 py-4 align-top"><input type="text" aria-label={`Field options row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" placeholder="Label:value, Label 2:value2" {...register(`fields.${index}.optionsText` as const)} {...getFieldGridInputProps(index, 5)} />{errors.fields?.[index]?.optionsText && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.fields[index]?.optionsText?.message}</p>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-500">Approval Steps</p>
                <Button type="button" variant="secondary" onClick={() => stepArray.append(createStepRow(organizationTypes[0]?.id ?? ''))} disabled={stepArray.fields.length >= 20 || organizationTypes.length === 0}>Add Step</Button>
              </div>
              <div className="h-[calc(100vh-430px)] min-h-56 overflow-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Check all approval steps" checked={allStepsChecked} onChange={toggleAllSteps} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Step Name" /></th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-slate-500"><RequiredHeader label="Organization Type" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stepArray.fields.map((field, index) => (
                      <tr key={field.formId}>
                        <td className="px-4 py-4 align-top"><input type="checkbox" aria-label={`Check approval step row ${index + 1}`} checked={checkedStepRows.includes(field.rowId)} onChange={() => toggleStepRow(field.rowId)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /></td>
                        <td className="px-4 py-4 align-top"><input type="hidden" {...register(`steps.${index}.rowId` as const)} /><input type="text" aria-label={`Step name row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`steps.${index}.name` as const)} {...getStepGridInputProps(index, 1)} />{errors.steps?.[index]?.name && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.steps[index]?.name?.message}</p>}</td>
                        <td className="px-4 py-4 align-top"><select aria-label={`Step organization type row ${index + 1}`} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" {...register(`steps.${index}.organizationTypeId` as const)} {...getStepGridInputProps(index, 2)}><option value="">Select organization type</option>{organizationTypes.map((organizationType) => <option key={organizationType.id} value={organizationType.id}>{organizationType.name}</option>)}</select>{errors.steps?.[index]?.organizationTypeId && <p role="alert" className="mt-1 text-xs font-semibold text-danger-600">{errors.steps[index]?.organizationTypeId?.message}</p>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-bold text-slate-500">Workflow Flow</p>
              <WorkflowFlow steps={stepPreview} />
            </section>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/workflows')}>Cancel</Button>
              <Button type="button" onClick={handleSubmit(onValid)} disabled={!isValid || isSaving || organizationTypesQuery.isLoading}>Submit</Button>
            </div>
          </form>
        )}
      </ContextMenu>
      <ConfirmDialog isOpen={Boolean(pendingValues)} title="Confirm Create Workflow" message="Review the form schema and approval steps before creating this workflow." confirmLabel="Confirm submit" isConfirming={isSaving} errorMessage={submitError ?? errors.root?.message} onConfirm={handleConfirmSubmit} onCancel={() => setPendingValues(null)} />
    </div>
  );
}
