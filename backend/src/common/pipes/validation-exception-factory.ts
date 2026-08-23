import { ValidationError } from 'class-validator';
import { ValidationException } from '../exceptions/app.exception';

/**
 * Converts class-validator's ValidationError[] (as produced by the global
 * ValidationPipe) into the { field: [messages] } shape required by the
 * API-ERROR-RESPONSE envelope's `fieldErrors`, then wraps it in a
 * ValidationException so the global filter emits a consistent VALIDATION_ERROR.
 */
export function validationExceptionFactory(errors: ValidationError[]): ValidationException {
  const fieldErrors: Record<string, string[]> = {};

  for (const error of errors) {
    collectFieldErrors(error, fieldErrors);
  }

  return new ValidationException(fieldErrors);
}

function collectFieldErrors(
  error: ValidationError,
  fieldErrors: Record<string, string[]>,
  parentPath = '',
): void {
  const path = parentPath ? `${parentPath}.${error.property}` : error.property;

  if (error.constraints) {
    fieldErrors[path] = Object.values(error.constraints);
  }

  for (const child of error.children ?? []) {
    collectFieldErrors(child, fieldErrors, path);
  }
}
