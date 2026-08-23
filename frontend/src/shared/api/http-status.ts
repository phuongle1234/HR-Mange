/**
 * Shared HTTP status code constants used across the API layer.
 * Kept as a const object (not a TS enum) per the project's erasable-syntax rule.
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

export type HttpStatusValue = (typeof HttpStatus)[keyof typeof HttpStatus];
