import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { FrontendApiError } from '../../../shared/api/api-error';
import { applyFieldErrors } from '../../../shared/utils/api-error-mapping';

const SAFE_LOGIN_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Incorrect email or password.',
  USER_DISABLED: 'This account is unavailable. Please contact an administrator.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait a moment and try again.',
};

/**
 * Maps a login failure to a safe, generic message.
 * Never reveals whether the email exists (INVALID_CREDENTIALS covers both
 * "unknown email" and "wrong password" on the backend).
 */
export function mapLoginError(error: FrontendApiError): string {
  return SAFE_LOGIN_MESSAGES[error.code] ?? 'Unable to sign in. Please try again.';
}

/**
 * Maps a change-password failure onto the form.
 * Returns a safe form-level message when the error isn't field-mappable,
 * or null once it has been fully applied to a field.
 */
export function mapChangePasswordError<T extends FieldValues>(
  error: FrontendApiError,
  setError: UseFormSetError<T>,
): string | null {
  if (applyFieldErrors(error, setError)) {
    return null;
  }

  if (error.code === 'CURRENT_PASSWORD_INVALID') {
    setError('currentPassword' as Path<T>, {
      type: 'server',
      message: 'Current password is incorrect.',
    });
    return null;
  }

  if (error.code === 'PASSWORD_POLICY_FAILED') {
    setError('newPassword' as Path<T>, { type: 'server', message: error.message });
    return null;
  }

  return error.message;
}
