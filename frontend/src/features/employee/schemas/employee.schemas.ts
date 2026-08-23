import { z } from 'zod';
import { EMPLOYEE_STATUS_VALUES } from '../types/employee.types';

const employeeCodeSchema = z
  .string()
  .trim()
  .min(1, 'Employee code is required')
  .max(50, 'Employee code must be 50 characters or fewer');

function nameSchema(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(100, `${label} must be 100 characters or fewer`);
}

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(255, 'Email must be 255 characters or fewer')
  .email('Enter a valid email address');

const phoneSchema = z.string().trim().max(30, 'Phone must be 30 characters or fewer');
const positionSchema = z.string().trim().max(100, 'Position must be 100 characters or fewer');
const statusSchema = z.enum(EMPLOYEE_STATUS_VALUES);

/** Mirrors CreateEmployeeDto (docs/06-api/employee/create-employee.md). No departmentId field. */
export const employeeCreateSchema = z.object({
  employeeCode: employeeCodeSchema,
  firstName: nameSchema('First name'),
  lastName: nameSchema('Last name'),
  email: emailSchema,
  phone: phoneSchema,
  position: positionSchema,
  status: statusSchema,
});
export type EmployeeCreateFormValues = z.infer<typeof employeeCreateSchema>;

/**
 * The edit form always shows a fully-populated form (prefilled from the
 * fetched employee), so it validates the same as create; only the payload
 * sent to the API (built separately) is narrowed to changed fields, mirroring
 * UpdateEmployeeDto's "all fields optional" contract at the wire level.
 */
export const employeeEditSchema = employeeCreateSchema;
export type EmployeeEditFormValues = z.infer<typeof employeeEditSchema>;

export const DEFAULT_EMPLOYEE_CREATE_VALUES: EmployeeCreateFormValues = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  status: 'ACTIVE',
};
