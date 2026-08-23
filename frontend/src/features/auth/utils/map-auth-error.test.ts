import { describe, expect, it, vi } from 'vitest';
import type { UseFormSetError } from 'react-hook-form';
import { FrontendApiError } from '../../../shared/api/api-error';
import { mapChangePasswordError, mapLoginError } from './map-auth-error';
import type { ChangePasswordFormValues } from '../schemas/auth.schemas';

describe('mapLoginError', () => {
  it('maps INVALID_CREDENTIALS to a safe generic message, never revealing which field was wrong', () => {
    const error = new FrontendApiError({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'raw backend detail',
    });
    expect(mapLoginError(error)).toBe('Incorrect email or password.');
  });

  it('maps USER_DISABLED to a safe account-unavailable message', () => {
    const error = new FrontendApiError({ status: 403, code: 'USER_DISABLED', message: 'raw' });
    expect(mapLoginError(error)).toBe(
      'This account is unavailable. Please contact an administrator.',
    );
  });

  it('maps unknown codes to a generic fallback', () => {
    const error = new FrontendApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'raw' });
    expect(mapLoginError(error)).toBe('Unable to sign in. Please try again.');
  });
});

describe('mapChangePasswordError', () => {
  function createSetErrorMock() {
    return vi.fn() as unknown as UseFormSetError<ChangePasswordFormValues>;
  }

  it('maps CURRENT_PASSWORD_INVALID onto the currentPassword field', () => {
    const setError = createSetErrorMock();
    const error = new FrontendApiError({
      status: 400,
      code: 'CURRENT_PASSWORD_INVALID',
      message: 'raw',
    });

    const result = mapChangePasswordError(error, setError);

    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledWith(
      'currentPassword',
      expect.objectContaining({ type: 'server' }),
    );
  });

  it('maps PASSWORD_POLICY_FAILED onto the newPassword field', () => {
    const setError = createSetErrorMock();
    const error = new FrontendApiError({
      status: 400,
      code: 'PASSWORD_POLICY_FAILED',
      message: 'Policy failed',
    });

    const result = mapChangePasswordError(error, setError);

    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledWith('newPassword', {
      type: 'server',
      message: 'Policy failed',
    });
  });

  it('applies VALIDATION_ERROR field errors before falling back to code mapping', () => {
    const setError = createSetErrorMock();
    const error = new FrontendApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      fieldErrors: { newPassword: ['Too weak'] },
    });

    const result = mapChangePasswordError(error, setError);

    expect(result).toBeNull();
    expect(setError).toHaveBeenCalledWith('newPassword', { type: 'server', message: 'Too weak' });
  });

  it('returns a safe form-level message for unmapped errors', () => {
    const setError = createSetErrorMock();
    const error = new FrontendApiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Server exploded',
    });

    const result = mapChangePasswordError(error, setError);

    expect(result).toBe('Server exploded');
    expect(setError).not.toHaveBeenCalled();
  });
});
