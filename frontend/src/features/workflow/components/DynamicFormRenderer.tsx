import { RequiredHeader } from '../../../shared/components/RequiredHeader';
import type { WorkflowFormField } from '../types/workflow.types';

interface DynamicFormRendererProps {
  fields: WorkflowFormField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function DynamicFormRenderer({ fields, values, onChange }: DynamicFormRendererProps) {

  return (
    <div className="grid grid-cols-12 gap-4">
      {
        fields.sort((a, b) => {
          if (a.type === 'textarea' && b.type !== 'textarea') return 1;
          if (a.type !== 'textarea' && b.type === 'textarea') return -1;
          return 0;
        }).map((field) => {
          const value = values[field.key] ?? '';
          const fieldClassName = field.type === 'textarea' ? 'col-span-12 block text-sm font-medium text-slate-700' : 'col-span-12 block text-sm font-medium text-slate-700 md:col-span-3';
          const label = field.required ? <RequiredHeader label={field.label} /> : field.label;

          if (field.type === 'textarea') {
            return (
              <label key={field.key} className={fieldClassName}>
                {label}
                <textarea value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className="mt-1 h-28 w-full rounded-lg border border-slate-200 p-3" placeholder={field.placeholder} />
              </label>
            );
          }

          if (field.type === 'select') {
            return (
              <label key={field.key} className={fieldClassName}>
                {label}
                <select value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3">
                  <option value="">Select an option</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            );
          }

          if (field.type === 'checkbox') {
            return (
              <label key={field.key} className="col-span-12 flex items-center gap-3 pt-6 text-sm font-medium text-slate-700 md:col-span-3">
                <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(field.key, event.target.checked)} className="h-4 w-4" />
                {label}
              </label>
            );
          }

          if (field.type === 'number') {
            return (
              <label key={field.key} className={fieldClassName}>
                {label}
                <input type="number" value={value === '' ? '' : Number(value)} onChange={(event) => onChange(field.key, Number(event.target.value))} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3" placeholder={field.placeholder} />
              </label>
            );
          }

          return (
            <label key={field.key} className={fieldClassName}>
              {label}
              <input type={field.type === 'date' ? 'date' : 'text'} value={String(value ?? '')} onChange={(event) => onChange(field.key, event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3" placeholder={field.placeholder} />
            </label>
          );
        })}
    </div>
  );
}
