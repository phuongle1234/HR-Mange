import { useCallback, useEffect } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { normalizeApiError } from '../api/api-error';

interface ApiFieldErrorOptions {
  mapFieldPath?: (fieldPath: string) => string;
}

function resolveFieldPath(fieldPath: string, options?: ApiFieldErrorOptions): string {
  return options?.mapFieldPath ? options.mapFieldPath(fieldPath) : fieldPath;
}

export function applyApiFieldErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, options?: ApiFieldErrorOptions): boolean {
  const apiError = normalizeApiError(error);
  const fieldEntries = Object.entries(apiError.fieldErrors ?? {});
  let hasAppliedError = false;

  for (const [fieldPath, messages] of fieldEntries) {
    const message = messages[0] ?? apiError.message;
    if (!message) {
      continue;
    }

    setError(resolveFieldPath(fieldPath, options) as Path<T>, { type: 'server', message });
    hasAppliedError = true;
  }

  return hasAppliedError;
}

export function useApplyApiFieldErrors<T extends FieldValues>(setError: UseFormSetError<T>, options?: ApiFieldErrorOptions) {
  return useCallback((error: unknown) => applyApiFieldErrors(error, setError, options), [options?.mapFieldPath, setError]);
}

export function useApiFieldErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, options?: ApiFieldErrorOptions): boolean {
  const applyFieldErrors = useApplyApiFieldErrors(setError, options);

  useEffect(() => {
    if (error) {
      applyFieldErrors(error);
    }
  }, [applyFieldErrors, error]);

  return Boolean(error);
}
