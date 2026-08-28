import { ValidationArguments } from 'class-validator';

/**
 * Shared plumbing that lets an array-level class-validator constraint report
 * WHICH row/field failed, instead of collapsing the whole batch into one
 * message on the array itself.
 *
 * Why array-level constraints exist at all: a per-item constraint would run
 * one database query per item (N+1) and could not see sibling rows, so it
 * could not detect duplicates inside the same request. Bulk validators
 * therefore stay on the `items` property and issue a single batched query -
 * but `validate()` only returns a boolean, so the row index had nowhere to
 * go. This module is that channel.
 *
 * Usage inside a bulk validator's `validate(value, args)`:
 *
 *   recordBulkFieldError(args, `items.${index}.employeeCode`, 'Employee code is already in use.');
 *   return false; // still MUST return false, or the request proceeds
 *
 * `validationExceptionFactory` then drains what was recorded and merges it
 * into the API-ERROR-RESPONSE `fieldErrors` map, producing granular paths:
 *
 *   { "items.0.employeeCode": ["..."], "items.1.email": ["..."] }
 *
 * Storage is a WeakMap keyed by the DTO instance: nothing is attached to the
 * DTO itself, entries cannot leak between requests, and they are collected
 * automatically once the request's DTO is gone.
 */
const bulkFieldErrorsByDto = new WeakMap<object, Record<string, string[]>>();

/**
 * Records one granular field error for the DTO currently being validated.
 * `path` must be the full path from the DTO root, e.g. `items.3.email`.
 */
export function recordBulkFieldError(args: ValidationArguments, path: string, message: string): void {
  const dto = args.object;
  const existing = bulkFieldErrorsByDto.get(dto) ?? {};
  const messages = existing[path] ?? [];

  // Guard against the same validator running twice for one path (e.g. a
  // constraint re-evaluated by a nested validation pass).
  if (!messages.includes(message)) {
    existing[path] = [...messages, message];
    bulkFieldErrorsByDto.set(dto, existing);
  }
}

/**
 * Returns and clears everything recorded for this DTO. Called once by
 * `validationExceptionFactory`; draining keeps a retried validation pass
 * from double-reporting.
 */
export function drainBulkFieldErrors(dto: object): Record<string, string[]> {
  const collected = bulkFieldErrorsByDto.get(dto);
  if (!collected) return {};

  bulkFieldErrorsByDto.delete(dto);
  return collected;
}
