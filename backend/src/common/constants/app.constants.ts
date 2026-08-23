/**
 * Shared literal values that would otherwise be hard-coded across modules.
 * Per AGENTS.md "Do not hard-code shared values; use constants, enums, config,
 * or environment variables."
 */
export const PASSWORD_MIN_LENGTH = 8;

/** At least one letter and one number, per WORK-000 decision #6. */
export const PASSWORD_POLICY_REGEX = {
  hasLetter: /[a-zA-Z]/,
  hasNumber: /[0-9]/,
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 100;

export const EMPLOYEE_SORTABLE_FIELDS = ['employeeCode', 'createdAt'] as const;
export type EmployeeSortableField = (typeof EMPLOYEE_SORTABLE_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const REQUEST_ID_HEADER = 'x-request-id';

export const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If the email is registered, password reset instructions will be sent.';
