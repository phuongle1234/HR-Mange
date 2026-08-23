import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import type { EmployeeCreateFormValues, EmployeeEditFormValues } from '../schemas/employee.schemas';
import type { CreateEmployeePayload, UpdateEmployeePayload } from '../types/employee.types';

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Trims and normalizes create-form values into the CreateEmployeeDto payload shape. */
export function buildCreateEmployeePayload(values: EmployeeCreateFormValues): CreateEmployeePayload {
  return {
    employeeCode: values.employeeCode.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: emptyToUndefined(values.phone),
    position: emptyToUndefined(values.position),
    status: values.status,
  };
}

/** Includes only fields React Hook Form marked dirty, per UpdateEmployeeDto's "all optional" contract. */
export function buildUpdateEmployeePayload(
  values: EmployeeEditFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<EmployeeEditFormValues>>>,
): UpdateEmployeePayload {
  const payload: UpdateEmployeePayload = {};

  if (dirtyFields.employeeCode) {
    payload.employeeCode = values.employeeCode.trim();
  }
  if (dirtyFields.firstName) {
    payload.firstName = values.firstName.trim();
  }
  if (dirtyFields.lastName) {
    payload.lastName = values.lastName.trim();
  }
  if (dirtyFields.email) {
    payload.email = values.email.trim().toLowerCase();
  }
  if (dirtyFields.phone) {
    payload.phone = emptyToUndefined(values.phone);
  }
  if (dirtyFields.position) {
    payload.position = emptyToUndefined(values.position);
  }
  if (dirtyFields.status) {
    payload.status = values.status;
  }

  return payload;
}
