export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta: Record<string, unknown> | null;
}

export interface SuccessResponseInput<T> {
  data: T;
  message: string;
  meta?: Record<string, unknown> | null;
}

/**
 * Builds the API-CONVENTIONS success envelope: { success, message, data, meta }.
 * This is the ONLY place that shape should be constructed, so controllers
 * never hand-roll the response envelope.
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
}
