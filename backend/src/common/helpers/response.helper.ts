export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta: Record<string, unknown> | null;
}

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}

export interface SuccessResponseInput<T> {
  data: T;
  message: string;
  meta?: Record<string, unknown> | null;
}

export interface ErrorResponseInput {
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}

/**
 * Builds API-CONVENTIONS response envelopes. Controllers use `success`;
 * GlobalHttpExceptionFilter uses `error`, so response shapes stay centralized.
 */
export class ResponseHelper {
  static success<T>({ data, message, meta = null }: SuccessResponseInput<T>): ApiSuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }

  static error({ statusCode, code, message, fieldErrors, requestId }: ErrorResponseInput): ApiErrorResponse {
    return {
      statusCode,
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
      ...(requestId ? { requestId } : {}),
    };
  }
}
