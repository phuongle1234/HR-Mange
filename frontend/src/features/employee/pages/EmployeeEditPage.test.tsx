import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithAppProviders } from '../../../test/render-with-app-providers';
import { FrontendApiError } from '../../../shared/api/api-error';
import { EmployeeEditPage } from './EmployeeEditPage';
import { employeeApiService } from '../services/employee.api';
import type { Employee } from '../types/employee.types';

vi.mock('../services/employee.api', () => ({
  employeeApiService: {
    detail: vi.fn(),
    update: vi.fn(),
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

const EMPLOYEE_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

const employee: Employee = {
  id: EMPLOYEE_ID,
  employeeCode: 'EMP-001',
  firstName: 'Mai',
  lastName: 'Nguyen',
  email: 'mai@example.com',
  phone: '0901234567',
  position: 'HR Lead',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderEditPage() {
  return renderWithAppProviders(
    <Routes>
      <Route path="/employees/:id/edit" element={<EmployeeEditPage />} />
    </Routes>,
    { route: `/employees/${EMPLOYEE_ID}/edit` },
  );
}

describe('EmployeeEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefills the form from the fetched employee', async () => {
    (employeeApiService.detail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(employee);
    renderEditPage();

    expect(await screen.findByDisplayValue('EMP-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mai')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nguyen')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mai@example.com')).toBeInTheDocument();
  });

  it('shows a not-found state on EMPLOYEE_NOT_FOUND', async () => {
    (employeeApiService.detail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({ status: 404, code: 'EMPLOYEE_NOT_FOUND', message: 'Not found' }),
    );
    renderEditPage();

    expect(await screen.findByText('Employee not found.')).toBeInTheDocument();
  });

  it('shows a no-change message and does not open the popup when nothing changed', async () => {
    (employeeApiService.detail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(employee);
    renderEditPage();
    await screen.findByDisplayValue('EMP-001');

    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('No changes to save.')).toBeInTheDocument();
    expect(screen.queryByText('Confirm Update Employee')).not.toBeInTheDocument();
    expect(employeeApiService.update).not.toHaveBeenCalled();
  });

  it('shows only the changed field in the confirm popup, then submits just that field', async () => {
    (employeeApiService.detail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(employee);
    (employeeApiService.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...employee,
      email: 'mai.updated@example.com',
    });

    renderEditPage();
    const emailInput = await screen.findByDisplayValue('mai@example.com');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'mai.updated@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Confirm Update Employee')).toBeInTheDocument();
    expect(screen.getByText('mai@example.com -> mai.updated@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm update' }));

    await waitFor(() =>
      expect(employeeApiService.update).toHaveBeenCalledWith(EMPLOYEE_ID, {
        email: 'mai.updated@example.com',
      }),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Employee updated successfully.', {
        position: 'top-right',
      }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(`/employees/${EMPLOYEE_ID}`));
  });

  it('maps EMPLOYEE_EMAIL_EXISTS to the email field and closes the popup', async () => {
    (employeeApiService.detail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(employee);
    (employeeApiService.update as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({
        status: 409,
        code: 'EMPLOYEE_EMAIL_EXISTS',
        message: 'Employee email already exists.',
      }),
    );

    renderEditPage();
    const emailInput = await screen.findByDisplayValue('mai@example.com');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'taken@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await screen.findByText('Confirm Update Employee');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm update' }));

    expect(await screen.findByText('Employee email already exists.')).toBeInTheDocument();
    expect(screen.queryByText('Confirm Update Employee')).not.toBeInTheDocument();
  });
});
