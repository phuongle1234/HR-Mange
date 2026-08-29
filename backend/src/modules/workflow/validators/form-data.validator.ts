import { ValidationException } from '../../../common/exceptions/app.exception';
import { WorkflowFormField, WorkflowFormSchema, parseFormSchema } from './form-schema.validator';

/**
 * Validates a submitted `form_data` object against its workflow's
 * `form_schema` (contract 3.2).
 *
 * WORK-029 reuses this VERBATIM for RESUBMIT - resubmitting must apply
 * exactly the same rules as the original submit, or an employee could bypass
 * validation simply by having their request sent back to them.
 *
 * Unlike the form-schema validator this is not a class-validator constraint:
 * the rules depend on the workflow row being submitted against, which is only
 * known after a database read, so it runs in the service and throws a
 * ValidationException carrying the same granular `formData.<key>` field paths.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/** Returns an error message when the value does not match the field type, else null. */
function checkFieldType(field: WorkflowFormField, value: unknown): string | null {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return typeof value === 'string' ? null : 'Must be a string.';

    case 'number':
      // Deliberately rejects numeric strings: the stored form_data must be
      // usable without re-parsing, and "5" vs 5 silently diverges downstream.
      return typeof value === 'number' && Number.isFinite(value) ? null : 'Must be a number.';

    case 'date':
      if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return 'Must be a YYYY-MM-DD date.';
      return Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) ? 'Must be a valid calendar date.' : null;

    case 'select': {
      if (typeof value !== 'string') return 'Must be one of the allowed options.';
      const allowed = (field.options ?? []).map((option) => option.value);
      return allowed.includes(value) ? null : `Must be one of: ${allowed.join(', ')}.`;
    }

    case 'checkbox':
      return typeof value === 'boolean' ? null : 'Must be true or false.';

    default:
      return 'Unsupported field type.';
  }
}

/**
 * Throws ValidationException with `formData.<key>` field paths when invalid.
 * Returns the validated data unchanged when valid.
 */
export function validateFormDataAgainstSchema(
  rawSchema: unknown,
  formData: unknown,
): Record<string, unknown> {
  const fieldErrors: Record<string, string[]> = {};

  const schema: WorkflowFormSchema | null = parseFormSchema(rawSchema);
  if (!schema) {
    // A stored schema that cannot be parsed is a server-side data problem, but
    // surfacing it as a form error is still more useful than a 500 with no clue.
    throw new ValidationException({ formData: ['This workflow has an invalid form schema.'] });
  }

  const data =
    typeof formData === 'object' && formData !== null && !Array.isArray(formData)
      ? (formData as Record<string, unknown>)
      : null;

  if (!data) {
    throw new ValidationException({ formData: ['formData must be an object.'] });
  }

  for (const field of schema.fields) {
    const value = data[field.key];

    if (isMissing(value)) {
      if (field.required) fieldErrors[`formData.${field.key}`] = ['This field is required.'];
      continue;
    }

    const typeError = checkFieldType(field, value);
    if (typeError) fieldErrors[`formData.${field.key}`] = [typeError];
  }

  // An extra key means the client and the schema disagree; accepting it would
  // silently persist data no form can ever show or edit again.
  const schemaKeys = new Set(schema.fields.map((field) => field.key));
  for (const key of Object.keys(data)) {
    if (!schemaKeys.has(key)) {
      fieldErrors[`formData.${key}`] = ['This field is not part of the workflow form.'];
    }
  }

  if (Object.keys(fieldErrors).length > 0) throw new ValidationException(fieldErrors);

  return data;
}
