import { ValidationError } from 'class-validator';
import { ValidationException } from '../exceptions/app.exception';
import { drainBulkFieldErrors } from '../validators/bulk-field-error-collector';

/**
 * Converts class-validator's ValidationError[] (as produced by the global
 * ValidationPipe) into the { field: [messages] } shape required by the
 * API-ERROR-RESPONSE envelope's `fieldErrors`, then wraps it in a
 * ValidationException so the global filter emits a consistent VALIDATION_ERROR.
 *
 * Nested paths come out dotted (`items.0.employeeCode`) because
 * `collectFieldErrors` walks `error.children` and joins each property.
 *
 * Array-level bulk constraints are a special case: they validate the whole
 * `items` array in one batched query, so class-validator only knows the
 * failure happened on `items`, not on which row. Those validators report
 * granular paths through `recordBulkFieldError` instead, and this factory
 * merges them in below - see `common/validators/bulk-field-error-collector.ts`.
 */
export function validationExceptionFactory(errors: ValidationError[]): ValidationException {
  const fieldErrors: Record<string, string[]> = {};

  for (const error of errors) {
    collectFieldErrors(error, fieldErrors);
  }

  mergeBulkFieldErrors(errors, fieldErrors);

  return new ValidationException(fieldErrors);
}

/**
 * Merges granular row/field errors recorded by array-level bulk validators.
 *
 * A recorded granular path replaces the generic array-level entry it came
 * from (e.g. `items.0.employeeCode` supersedes a blanket `items` message),
 * so the client gets the specific cell rather than both.
 */
function mergeBulkFieldErrors(errors: ValidationError[], fieldErrors: Record<string, string[]>): void {
  // Every ValidationError from one request shares the same root DTO target,
  // so draining once per distinct target covers the whole batch.
  const targets = new Set(errors.map((error) => error.target).filter((target): target is object => !!target));

  for (const target of targets) {
    const recorded = drainBulkFieldErrors(target);

    for (const [path, messages] of Object.entries(recorded)) {
      const parentPath = path.slice(0, path.indexOf('.'));
      if (parentPath && parentPath !== path) {
        delete fieldErrors[parentPath];
      }
      fieldErrors[path] = [...(fieldErrors[path] ?? []), ...messages];
    }
  }
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
