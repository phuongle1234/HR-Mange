import { ValidationException } from '../../../../common/exceptions/app.exception';
import type { WorkflowFormSchema } from '../../shared/workflow-contract.types';

function isDateString(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateWorkflowFormData(schema: WorkflowFormSchema, formData: Record<string, unknown>): void {
  const fieldErrors: Record<string, string[]> = {};
  const allowedKeys = new Set(schema.fields.map((field) => field.key));

  for (const key of Object.keys(formData)) {
    if (!allowedKeys.has(key)) {
      fieldErrors[`formData.${key}`] = ['Field is not defined in the workflow schema.'];
    }
  }

  for (const field of schema.fields) {
    const value = formData[field.key];
    const path = `formData.${field.key}`;
    if (field.required && (value === undefined || value === null || value === '')) {
      fieldErrors[path] = ['Field is required.'];
      continue;
    }
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if ((field.type === 'text' || field.type === 'textarea') && typeof value !== 'string') {
      fieldErrors[path] = ['Must be a string.'];
    }
    if (field.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
      fieldErrors[path] = ['Must be a finite number.'];
    }
    if (field.type === 'date' && !isDateString(value)) {
      fieldErrors[path] = ['Must be a YYYY-MM-DD date.'];
    }
    if (field.type === 'select' && (typeof value !== 'string' || !field.options?.some((option) => option.value === value))) {
      fieldErrors[path] = ['Must be one of the allowed options.'];
    }
    if (field.type === 'checkbox' && typeof value !== 'boolean') {
      fieldErrors[path] = ['Must be a boolean.'];
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationException(fieldErrors);
  }
}
