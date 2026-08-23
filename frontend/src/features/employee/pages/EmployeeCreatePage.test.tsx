import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAppProviders } from '../../../test/render-with-app-providers';
import { FrontendApiError } from '../../../shared/api/api-error';
import { EmployeeCreatePage } from './EmployeeCreatePage';
import { employeeApiService } from '../services/employee.api';
import type { Employee } from '../types/employee.types';

vi.mock('../services/employee.api', () => ({
  employeeApiService: {
    create: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const toastSuccess = vi.fn();
vi.mock('react-toastify', () => ({
  toast: { success: (...args: unknown[]) => toastSuccess(...args) },
}));

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('Employee code'), 'EMP-003');
  await userEvent.type(screen.getByLabelText('First name'), 'Lan');
  await userEvent.type(screen.getByLabelText('Last name'), 'Pham');
  await userEvent.type(screen.getByLabelText('Email'), 'lan@example.com');
}

describe('EmployeeCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors and does not open the confirm popup when required fields are empty', async () => {
    renderWithAppProviders(<EmployeeCreatePage />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Employee code is required')).toBeInTheDocument();
    expect(screen.queryByText('Confirm Create Employee')).not.toBeInTheDocument();
  });

  it('opens the confirm popup with a review of the entered values', async () => {
    renderWithAppProviders(<EmployeeCreatePage />);
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Confirm Create Employee')).toBeInTheDocument();
    expect(screen.getByText('Lan Pham')).toBeInTheDocument();
    expect(screen.getByText('lan@example.com')).toBeInTheDocument();
  });

  it('creates the employee and navigates to its detail page on success', async () => {
    const created: Employee = {
      id: 'emp-new',
      employeeCode: 'EMP-003',
      firstName: 'Lan',
      lastName: 'Pham',
      email: 'lan@example.com',
      phone: null,
      position: null,
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    (employeeApiService.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(created);

    renderWithAppProviders(<EmployeeCreatePage />);
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Confirm Create Employee');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm submit' }));

    await waitFor(() =>
      expect(employeeApiService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeCode: 'EMP-003',
          firstName: 'Lan',
          lastName: 'Pham',
          email: 'lan@example.com',
          status: 'ACTIVE',
        }),
      ),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Employee created successfully.', {
        position: 'top-right',
      }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/employees/emp-new'));
  });

  it('maps EMPLOYEE_CODE_EXISTS to the employeeCode field and closes the popup', async () => {
    (employeeApiService.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({
        status: 409,
        code: 'EMPLOYEE_CODE_EXISTS',
        message: 'Employee code already exists.',
      }),
    );

    renderWithAppProviders(<EmployeeCreatePage />);
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Confirm Create Employee');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm submit' }));

    expect(await screen.findByText('Employee code already exists.')).toBeInTheDocument();
    expect(screen.queryByText('Confirm Create Employee')).not.toBeInTheDocument();
  });

  it('maps EMPLOYEE_EMAIL_EXISTS to the email field and closes the popup', async () => {
    (employeeApiService.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({
        status: 409,
        code: 'EMPLOYEE_EMAIL_EXISTS',
        message: 'Employee email already exists.',
      }),
    );

    renderWithAppProviders(<EmployeeCreatePage />);
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Confirm Create Employee');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm submit' }));

    expect(await screen.findByText('Employee email already exists.')).toBeInTheDocument();
    expect(screen.queryByText('Confirm Create Employee')).not.toBeInTheDocument();
  });

  it('keeps the popup open and shows a safe message for a non-field error', async () => {
    (employeeApiService.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'Server exploded' }),
    );

    renderWithAppProviders(<EmployeeCreatePage />);
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Confirm Create Employee');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm submit' }));

    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    expect(screen.getByText('Confirm Create Employee')).toBeInTheDocument();
  });
});
