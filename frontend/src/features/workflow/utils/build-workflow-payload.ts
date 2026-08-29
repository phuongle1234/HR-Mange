import type { WorkflowDraftFormValues, WorkflowFormField } from '../types/workflow.types';

export function buildWorkflowPayload(values: WorkflowDraftFormValues) {
  return {
    code: values.code,
    name: values.name,
    description: values.description || null,
    status: values.status,
    formSchema: {
      fields: values.fields.map((field: WorkflowFormField) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        options: field.type === 'select' ? (field.options ?? []) : undefined,
      })),
    },
  };
}
