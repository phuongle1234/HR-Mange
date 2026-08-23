import type { EmployeeListQueryState } from '../types/employee.types';

/** Stable, serializable TanStack Query keys for the employee feature. */
export const employeeQueryKeys = {
  all: ['employees'] as const,
  list: (query: EmployeeListQueryState) => ['employees', query] as const,
  detail: (id: string) => ['employees', id] as const,
};
