import type { EmployeeEditFormValues } from '../schemas/employee.schemas';
import type { Employee, UpdateEmployeePayload } from '../types/employee.types';

export function mapEmployeeToFormValues(employee: Employee): EmployeeEditFormValues {
  return {
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? '',
    position: employee.position ?? '',
    status: employee.status,
  };
}

export interface ChangedFieldReview {
  field: string;
  label: string;
  previousValue: string;
  nextValue: string;
}

const FIELD_LABELS: Record<string, string> = {
  employeeCode: 'Employee code',
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  position: 'Position',
  status: 'Status',
};

const EMPTY_VALUE_PLACEHOLDER = '—';

/** Builds the previous -> new value rows shown in the edit confirm popup. */
export function buildChangedFieldsReview(
  payload: UpdateEmployeePayload,
  employee: Employee,
): ChangedFieldReview[] {
  return Object.entries(payload).map(([field, nextValue]) => {
    const previousRaw = (employee as unknown as Record<string, unknown>)[field];
    return {
      field,
      label: FIELD_LABELS[field] ?? field,
      previousValue:
        previousRaw === null || previousRaw === undefined || previousRaw === ''
          ? EMPTY_VALUE_PLACEHOLDER
          : String(previousRaw),
      nextValue:
        nextValue === null || nextValue === undefined || nextValue === ''
          ? EMPTY_VALUE_PLACEHOLDER
          : String(nextValue),
    };
  });
}
