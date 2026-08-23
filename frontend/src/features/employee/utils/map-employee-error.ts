import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { FrontendApiError } from '../../../shared/api/api-error';

const CODE_TO_FIELD: Record<string, string> = {
  EMPLOYEE_CODE_EXISTS: 'employeeCode',
  EMPLOYEE_EMAIL_EXISTS: 'email',
};

export interface EmployeeFormErrorResult {
  /** Safe form-level message, set only when the error wasn't field-mappable. */
  formMessage: string | null;
  /** First field name that received a `setError` call, for focusing. Null when non-field. */
  firstField: string | null;
}

/**
 * Maps an employee create/update API error onto the form: VALIDATION_ERROR's
 * fieldErrors take priority, then EMPLOYEE_CODE_EXISTS/EMPLOYEE_EMAIL_EXISTS
 * map to their field. Anything else is returned as a safe form-level message.
 */
export function mapEmployeeFormError<T extends FieldValues>(
  error: FrontendApiError,
  setError: UseFormSetError<T>,
): EmployeeFormErrorResult {
  let firstField: string | null = null;

  if (error.fieldErrors) {
    for (const [field, messages] of Object.entries(error.fieldErrors)) {
      if (messages && messages.length > 0) {
        setError(field as Path<T>, { type: 'server', message: messages[0] });
        firstField ??= field;
      }
    }
  }

  if (!firstField) {
    const mappedField = CODE_TO_FIELD[error.code];
    if (mappedField) {
      setError(mappedField as Path<T>, { type: 'server', message: error.message });
      firstField = mappedField;
    }
  }

  return { formMessage: firstField ? null : error.message, firstField };
}
