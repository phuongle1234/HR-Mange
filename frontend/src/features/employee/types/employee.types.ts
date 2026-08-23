/**
 * Employee status enum values, per WORK-000 decision #5.
 * Kept as a const tuple + derived union type (not a TS enum) per the
 * project's erasable-syntax rule.
 */
export const EMPLOYEE_STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUS_VALUES)[number];

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
  TERMINATED: 'Terminated',
};

/** There is no departmentId field anywhere — Department was removed (WORK-000 decision #1). */
export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string | null;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListQueryState {
  page: number;
  limit: number;
  search: string;
  status: EmployeeStatus | '';
  sortBy: 'employeeCode' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface EmployeeListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface CreateEmployeePayload {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  status: EmployeeStatus;
}

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;
