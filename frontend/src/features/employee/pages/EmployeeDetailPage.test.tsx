import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithAppProviders } from '../../../test/render-with-app-providers';
import { FrontendApiError } from '../../../shared/api/api-error';
import { EmployeeDetailPage } from './EmployeeDetailPage';
import { employeeApiService } from '../services/employee.api';
import type { Employee } from '../types/employee.types';

vi.mock('../services/employee.api', () => ({
  employeeApiService: {
    detail: vi.fn(),
    delete: vi.fn(),
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

function renderDetailPage(id: string) {
  return renderWithAppProviders(
    <Routes>
      <Route path="/employees/:id" element={<EmployeeDetailPage />} />
    </Routes>,
    { route: `/employees/${id}` },
  );
}

describe('EmployeeDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an invalid/not-found state when the id is not a valid UUID', () => {
    renderDetailPage('not-a-uuid');
    expect(screen.getByText('This employee could not be found.')).toBeInTheDocument();
    expect(employeeApiService.detail).not.toHaveBeenCalled();
  });

  it('shows a loading state while the detail query is pending', () => {
    (employeeApiService.detail as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderDetailPage(EMPLOYEE_ID);
    expect(screen.getByText('Loading employee…')).toBeInTheDocument();
  });

  it('shows a not-found state on EMPLOYEE_NOT_FOUND', async () => {
    (employeeApiService.detail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({ status: 404, code: 'EMPLOYEE_NOT_FOUND', message: 'Not found' }),
    );
    renderDetailPage(EMPLOYEE_ID);

    expect(await screen.findByText('Employee not found.')).toBeInTheDocument();
  });

  it('renders employee information tiles on success', async () => {
    (employeeApiService.detail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(employee);
    renderDetailPage(EMPLOYEE_ID);

    expect(await screen.findByText('EMP-001')).toBeInTheDocument();
    expect(screen.getByText('Mai Nguyen')).toBeInTheDocument();
    expect(screen.getByText('mai@example.com')).toBeInTheDocument();
    expect(screen.getByText('HR Lead')).toBeInTheDocument();
    // Edit/Delete are always visible to any authenticated user (no permission model, WORK-000 #2).
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('reuses the delete confirm popup and navigates to the list on success', async () => {
    (employeeApiService.detail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(employee);
    (employeeApiService.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    renderDetailPage(EMPLOYEE_ID);
    await screen.findByText('EMP-001');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Confirm Delete Employee')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => expect(employeeApiService.delete).toHaveBeenCalledWith(EMPLOYEE_ID));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Employee deleted successfully.', {
        position: 'top-right',
      }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/employees'));
  });
});
