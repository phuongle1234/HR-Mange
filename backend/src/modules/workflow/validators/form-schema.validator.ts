import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { recordBulkFieldError } from '../../../common/validators/bulk-field-error-collector';

/**
 * Validates the `form_schema` JSON authored by an admin (contract 3.1).
 *
 * This is the schema (which fields exist), NOT the data (what an employee
 * typed) - see form-data.validator.ts for the latter. The two must never be
 * conflated.
 *
 * Implemented as a class-validator constraint rather than controller code:
 * AGENTS.md forbids validation in controllers. Per-field failures are
 * reported at granular paths (`formSchema.fields.0.options`) through the same
 * collector the bulk employee validators use.
 */

export const WORKFLOW_FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select', 'checkbox'] as const;
export type WorkflowFieldType = (typeof WORKFLOW_FIELD_TYPES)[number];

const FIELD_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const ALLOWED_FIELD_PROPERTIES = ['key', 'label', 'type', 'required', 'options'];

export interface WorkflowFormFieldOption {
  label: string;
  value: string;
}

export interface WorkflowFormField {
  key: string;
  label: string;
  type: WorkflowFieldType;
  required?: boolean;
  options?: WorkflowFormFieldOption[];
}

export interface WorkflowFormSchema {
  fields: WorkflowFormField[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Returns the schema when it is structurally valid, otherwise null. Callers
 * that already trust the value (e.g. reading a persisted workflow) use this
 * to narrow without duplicating the checks.
 */
export function parseFormSchema(value: unknown): WorkflowFormSchema | null {
  if (!isPlainObject(value) || !Array.isArray(value.fields)) return null;
  return value as unknown as WorkflowFormSchema;
}

function validateOptions(
  field: Record<string, unknown>,
  path: string,
  args: ValidationArguments,
): boolean {
  const isSelect = field.type === 'select';
  const hasOptions = 'options' in field;

  if (!isSelect) {
    if (!hasOptions) return true;
    recordBulkFieldError(args, `${path}.options`, 'options is only allowed when type is "select".');
    return false;
  }

  if (!Array.isArray(field.options) || field.options.length === 0) {
    recordBulkFieldError(args, `${path}.options`, 'options is required and must not be empty for a select field.');
    return false;
  }

  let isValid = true;
  const seenValues = new Set<string>();

  field.options.forEach((option, optionIndex) => {
    const optionPath = `${path}.options.${optionIndex}`;
    if (!isPlainObject(option) || !isNonEmptyString(option.label) || !isNonEmptyString(option.value)) {
      recordBulkFieldError(args, optionPath, 'Each option requires a non-empty label and value.');
      isValid = false;
      return;
    }
    if (seenValues.has(option.value)) {
      recordBulkFieldError(args, `${optionPath}.value`, 'Option values must be unique within a field.');
      isValid = false;
      return;
    }
    seenValues.add(option.value);
  });

  return isValid;
}

function validateField(
  field: unknown,
  index: number,
  seenKeys: Set<string>,
  args: ValidationArguments,
): boolean {
  const path = `formSchema.fields.${index}`;

  if (!isPlainObject(field)) {
    recordBulkFieldError(args, path, 'Each field must be an object.');
    return false;
  }

  let isValid = true;

  const unknownProperties = Object.keys(field).filter((key) => !ALLOWED_FIELD_PROPERTIES.includes(key));
  if (unknownProperties.length > 0) {
    recordBulkFieldError(args, path, `Unknown field properties: ${unknownProperties.join(', ')}.`);
    isValid = false;
  }

  if (!isNonEmptyString(field.key) || !FIELD_KEY_PATTERN.test(field.key)) {
    recordBulkFieldError(args, `${path}.key`, 'key must start with a letter and contain only letters, digits, or underscores.');
    isValid = false;
  } else if (seenKeys.has(field.key)) {
    recordBulkFieldError(args, `${path}.key`, 'Field keys must be unique within the schema.');
    isValid = false;
  } else {
    seenKeys.add(field.key);
  }

  if (!isNonEmptyString(field.label)) {
    recordBulkFieldError(args, `${path}.label`, 'label is required.');
    isValid = false;
  }

  if (typeof field.type !== 'string' || !WORKFLOW_FIELD_TYPES.includes(field.type as WorkflowFieldType)) {
    recordBulkFieldError(args, `${path}.type`, `type must be one of ${WORKFLOW_FIELD_TYPES.join(', ')}.`);
    isValid = false;
  }

  if ('required' in field && typeof field.required !== 'boolean') {
    recordBulkFieldError(args, `${path}.required`, 'required must be a boolean.');
    isValid = false;
  }

  if (!validateOptions(field, path, args)) {
    isValid = false;
  }

  return isValid;
}

@ValidatorConstraint({ name: 'IsValidWorkflowFormSchema', async: false })
export class IsValidWorkflowFormSchemaConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (!isPlainObject(value)) {
      recordBulkFieldError(args, 'formSchema', 'formSchema must be an object.');
      return false;
    }

    const unknownRootProperties = Object.keys(value).filter((key) => key !== 'fields');
    if (unknownRootProperties.length > 0) {
      recordBulkFieldError(args, 'formSchema', `Unknown properties: ${unknownRootProperties.join(', ')}.`);
      return false;
    }

    if (!Array.isArray(value.fields) || value.fields.length === 0) {
      recordBulkFieldError(args, 'formSchema.fields', 'fields is required and must contain at least one field.');
      return false;
    }

    const seenKeys = new Set<string>();
    return value.fields.reduce<boolean>(
      (isValid, field, index) => validateField(field, index, seenKeys, args) && isValid,
      true,
    );
  }

  defaultMessage(): string {
    return 'formSchema is invalid.';
  }
}

export function IsValidWorkflowFormSchema(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidWorkflowFormSchemaConstraint,
    });
  };
}
