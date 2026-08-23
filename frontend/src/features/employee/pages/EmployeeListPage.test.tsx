import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAppProviders } from '../../../test/render-with-app-providers';
import { FrontendApiError } from '../../../shared/api/api-error';
import { EmployeeListPage } from './EmployeeListPage';
import { employeeApiService } from '../services/employee.api';
import type { Employee } from '../types/employee.types';

vi.mock('../services/employee.api', () => ({
  employeeApiService: {
    list: vi.fn(),
    delete: vi.fn(),
  },
}));

const toastSuccess = vi.fn();
vi.mock('react-toastify', () => ({
  toast: { success: (...args: unknown[]) => toastSuccess(...args) },
}));

const employees: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'EMP-001',
    firstName: 'Mai',
    lastName: 'Nguyen',
    email: 'mai@example.com',
    phone: '0901234567',
    position: 'HR Lead',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'emp-2',
    employeeCode: 'EMP-002',
    firstName: 'An',
    lastName: 'Tran',
    email: 'an@example.com',
    phone: null,
    position: 'Engineer',
    status: 'ON_LEAVE',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

function mockList(result: Employee[]) {
  (employeeApiService.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    items: result,
    meta: { page: 1, limit: 10, total: result.length },
  });
}

describe('EmployeeListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while the list query is pending', () => {
    (employeeApiService.list as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderWithAppProviders(<EmployeeListPage />);
    expect(screen.getByText('Loading employees…')).toBeInTheDocument();
  });

  it('shows an empty state when there are no employees', async () => {
    mockList([]);
    renderWithAppProviders(<EmployeeListPage />);
    expect(await screen.findByText('No employees found.')).toBeInTheDocument();
  });

  it('shows an error state with retry when the query fails', async () => {
    (employeeApiService.list as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'raw' }),
    );
    renderWithAppProviders(<EmployeeListPage />);

    expect(
      await screen.findByText('Unable to load employees. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders the employee table on success', async () => {
    mockList(employees);
    renderWithAppProviders(<EmployeeListPage />);

    expect(await screen.findByText('EMP-001')).toBeInTheDocument();
    expect(screen.getByText('Mai Nguyen')).toBeInTheDocument();
    expect(screen.getByText('EMP-002')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-2 of 2 employees')).toBeInTheDocument();
  });

  it('opens the delete confirm popup, then cancels without deleting', async () => {
    mockList(employees);
    renderWithAppProviders(<EmployeeListPage />);
    await screen.findByText('EMP-001');

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await userEvent.click(deleteButtons[0]);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Confirm Delete Employee')).toBeInTheDocument();
    expect(within(dialog).getByText('EMP-001')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Confirm Delete Employee')).not.toBeInTheDocument();
    expect(employeeApiService.delete).not.toHaveBeenCalled();
  });

  it('confirms delete, invalidates the list, and shows a success toast', async () => {
    mockList(employees);
    (employeeApiService.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    renderWithAppProviders(<EmployeeListPage />);
    await screen.findByText('EMP-001');

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await userEvent.click(deleteButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => expect(employeeApiService.delete).toHaveBeenCalledWith('emp-1'));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Employee deleted successfully.', {
        position: 'top-right',
      }),
    );
    expect(screen.queryByText('Confirm Delete Employee')).not.toBeInTheDocument();
  });

  it('keeps the popup open and shows the error when delete fails', async () => {
    mockList(employees);
    (employeeApiService.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'Could not delete.' }),
    );
    renderWithAppProviders(<EmployeeListPage />);
    await screen.findByText('EMP-001');

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await userEvent.click(deleteButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(await screen.findByText('Could not delete.')).toBeInTheDocument();
    expect(screen.getByText('Confirm Delete Employee')).toBeInTheDocument();
  });
});
