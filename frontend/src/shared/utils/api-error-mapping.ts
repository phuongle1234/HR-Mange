import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { FrontendApiError } from '../api/api-error';

/**
 * Apply every field returned in `FrontendApiError.fieldErrors` (VALIDATION_ERROR
 * responses) onto the form via React Hook Form's `setError`.
 * Returns true when at least one field error was applied.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: FrontendApiError,
  setError: UseFormSetError<T>,
): boolean {
  if (!error.fieldErrors) {
    return false;
  }

  let applied = false;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (messages && messages.length > 0) {
      setError(field as Path<T>, { type: 'server', message: messages[0] });
      applied = true;
    }
  }

  return applied;
}
