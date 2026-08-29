import type { WorkflowFormField } from '../types/workflow.types';

interface FormSchemaBuilderProps {
  fields: WorkflowFormField[];
  onChange: (fields: WorkflowFormField[]) => void;
}

export function FormSchemaBuilder({ fields, onChange }: FormSchemaBuilderProps) {
  function updateField(index: number, patch: Partial<WorkflowFormField>) {
    onChange(fields.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)));
  }

  function appendField() {
    onChange([
      ...fields,
      {
        key: `field_${fields.length + 1}`,
        label: `Field ${fields.length + 1}`,
        type: 'text',
        required: false,
      },
    ]);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
  }

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={`${field.key}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              Key
              <input value={field.key} onChange={(event) => updateField(index, { key: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Label
              <input value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Type
              <select value={field.type} onChange={(event) => updateField(index, { type: event.target.value as WorkflowFormField['type'] })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3">
                <option value="text">text</option>
                <option value="textarea">textarea</option>
                <option value="number">number</option>
                <option value="date">date</option>
                <option value="select">select</option>
                <option value="checkbox">checkbox</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} />
              Required
            </label>
          </div>

          {field.type === 'select' && (
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Options</div>
              <div className="grid gap-2">
                {(field.options ?? [{ label: 'Option 1', value: 'option_1' }]).map((option, optionIndex) => (
                  <div key={`${field.key}-option-${optionIndex}`} className="grid gap-2 md:grid-cols-2">
                    <input value={option.label} onChange={(event) => updateField(index, { options: [...(field.options ?? []), ...[]].map((existingOption, existingIndex) => existingIndex === optionIndex ? { ...existingOption, label: event.target.value } : existingOption) })} className="h-10 rounded-lg border border-slate-200 px-3" />
                    <input value={option.value} onChange={(event) => updateField(index, { options: [...(field.options ?? []), ...[]].map((existingOption, existingIndex) => existingIndex === optionIndex ? { ...existingOption, value: event.target.value } : existingOption) })} className="h-10 rounded-lg border border-slate-200 px-3" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => removeField(index)} className="rounded-lg border border-danger-200 px-3 py-2 text-sm font-bold text-danger-600">
              Remove
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={appendField} className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">
        Add field
      </button>
    </div>
  );
}
