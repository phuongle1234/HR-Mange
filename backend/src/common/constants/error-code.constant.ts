/**
 * Canonical set of API error codes used across the system.
 * Source: docs/06-api/error-response.md, docs/06-api/authentication.md,
 * docs/06-api/employee/*.md.
 *
 * Do not hard-code these strings inline in services/controllers; always
 * reference this enum so the set of valid codes stays discoverable in one place.
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',

  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_DISABLED = 'USER_DISABLED',
  CURRENT_PASSWORD_INVALID = 'CURRENT_PASSWORD_INVALID',
  PASSWORD_POLICY_FAILED = 'PASSWORD_POLICY_FAILED',

  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND',
}
