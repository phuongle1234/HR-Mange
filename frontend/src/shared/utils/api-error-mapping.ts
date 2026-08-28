import type { FieldValues, UseFormSetError } from 'react-hook-form';
import type { FrontendApiError } from '../api/api-error';
import { applyApiFieldErrors } from '../hooks/useApiFieldErrors';

/**
 * Apply every field returned in `FrontendApiError.fieldErrors` (VALIDATION_ERROR
 * responses) onto the form via React Hook Form's `setError`.
 * Returns true when at least one field error was applied.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: FrontendApiError,
  setError: UseFormSetError<T>,
): boolean {
  return applyApiFieldErrors(error, setError);
}
