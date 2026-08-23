import axios from 'axios';

/**
 * Backend non-2xx error shape, per docs/06-api/error-response.md:
 * { statusCode, code, message, fieldErrors, requestId }
 */
export interface BackendErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}

export interface FrontendApiErrorInit {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  originalError?: unknown;
}

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const NETWORK_ERROR_MESSAGE =
  'Unable to reach the server. Please check your connection and try again.';

/**
 * Safe, normalized frontend representation of an API error.
 * `originalError` is intentionally kept off the rendered UI surface —
 * it exists only for logging/debugging boundaries, never for display.
 */
export class FrontendApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly requestId?: string;
  readonly originalError?: unknown;

  constructor(init: FrontendApiErrorInit) {
    super(init.message);
    this.name = 'FrontendApiError';
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors;
    this.requestId = init.requestId;
    this.originalError = init.originalError;
  }
}

/**
 * Convert any thrown value (Axios error, network failure, or unknown) into a
 * safe FrontendApiError. Never surfaces stack traces or raw backend payloads.
 */
export function normalizeApiError(error: unknown): FrontendApiError {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data as Partial<BackendErrorResponse> | undefined;
      return new FrontendApiError({
        status: error.response.status,
        code: data?.code ?? 'UNKNOWN_ERROR',
        message: data?.message ?? GENERIC_ERROR_MESSAGE,
        fieldErrors: data?.fieldErrors,
        requestId: data?.requestId,
        originalError: error,
      });
    }

    return new FrontendApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: NETWORK_ERROR_MESSAGE,
      originalError: error,
    });
  }

  if (error instanceof FrontendApiError) {
    return error;
  }

  return new FrontendApiError({
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: GENERIC_ERROR_MESSAGE,
    originalError: error,
  });
}
