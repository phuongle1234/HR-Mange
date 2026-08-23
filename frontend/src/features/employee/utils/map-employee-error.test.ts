import { describe, expect, it, vi } from 'vitest';
import type { UseFormSetError } from 'react-hook-form';
import { FrontendApiError } from '../../../shared/api/api-error';
import { mapEmployeeFormError } from './map-employee-error';
import type { EmployeeCreateFormValues } from '../schemas/employee.schemas';

function createSetErrorMock() {
  return vi.fn() as unknown as UseFormSetError<EmployeeCreateFormValues>;
}

describe('mapEmployeeFormError', () => {
  it('maps EMPLOYEE_CODE_EXISTS to the employeeCode field', () => {
    const setError = createSetErrorMock();
    const error = new FrontendApiError({
      status: 409,
      code: 'EMPLOYEE_CODE_EXISTS',
      message: 'Employee code already exists.',
    });

    const result = mapEmployeeFormError(error, setError);

    expect(result.formMessage).toBeNull();
    expect(result.firstField).toBe('employeeCode');
    expect(setError).toHaveBeenCalledWith('employeeCode', {
      type: 'server',
      message: 'Employee code already exists.',
    });
  });

  it('maps EMPLOYEE_EMAIL_EXISTS to the email field', () => {
    const setError = createSetErrorMock();
    const error = new FrontendApiError({
      status: 409,
      code: 'EMPLOYEE_EMAIL_EXISTS',
      message: 'Employee email already exists.',
    });

    const result = mapEmployeeFormError(error, setError);

    expect(result.formMessage).toBeNull();
    expect(result.firstField).toBe('email');
  });

  it('applies VALIDATION_ERROR fieldErrors and reports the first field for focusing', () => {
    const setError = createSetErrorMock();
    const error = new FrontendApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      fieldErrors: { email: ['Enter a valid email address'] },
    });

    const result = mapEmployeeFormError(error, setError);

    expect(result.formMessage).toBeNull();
    expect(result.firstField).toBe('email');
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Enter a valid email address',
    });
  });

  it('returns a safe form-level message with no field for EMPLOYEE_NOT_FOUND', () => {
    const setError = createSetErrorMock();
    const error = new FrontendApiError({
      status: 404,
      code: 'EMPLOYEE_NOT_FOUND',
      message: 'Employee not found.',
    });

    const result = mapEmployeeFormError(error, setError);

    expect(result.formMessage).toBe('Employee not found.');
    expect(result.firstField).toBeNull();
    expect(setError).not.toHaveBeenCalled();
  });
});
