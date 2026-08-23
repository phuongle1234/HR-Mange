import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { FrontendApiError, normalizeApiError } from './api-error';

describe('normalizeApiError', () => {
  it('maps an Axios error carrying the backend error envelope', () => {
    const axiosError = new AxiosError('Request failed', undefined, undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: {
        statusCode: 409,
        code: 'EMPLOYEE_CODE_EXISTS',
        message: 'Employee code already exists.',
        fieldErrors: { employeeCode: ['Employee code already exists.'] },
        requestId: 'req-1',
      },
    });

    const result = normalizeApiError(axiosError);

    expect(result).toBeInstanceOf(FrontendApiError);
    expect(result.status).toBe(409);
    expect(result.code).toBe('EMPLOYEE_CODE_EXISTS');
    expect(result.message).toBe('Employee code already exists.');
    expect(result.fieldErrors).toEqual({ employeeCode: ['Employee code already exists.'] });
    expect(result.requestId).toBe('req-1');
    // originalError must be kept off any rendered surface but is retained for logging boundaries.
    expect(result.originalError).toBe(axiosError);
  });

  it('maps a network error (no response) to a safe NETWORK_ERROR', () => {
    const axiosError = new AxiosError('Network Error');
    const result = normalizeApiError(axiosError);

    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.status).toBe(0);
  });

  it('falls back to a safe generic message when the backend omits one', () => {
    const axiosError = new AxiosError('Request failed', undefined, undefined, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {} as never,
      data: {},
    });

    const result = normalizeApiError(axiosError);
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('Something went wrong. Please try again.');
  });

  it('maps a completely unknown thrown value to a safe generic error', () => {
    const result = normalizeApiError('boom');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.status).toBe(0);
  });

  it('passes an already-normalized FrontendApiError through unchanged', () => {
    const original = new FrontendApiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
    });
    const result = normalizeApiError(original);
    expect(result).toBe(original);
  });
});
