import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FrontendApiError } from '../../../shared/api/api-error';
import { ChangePasswordPage } from './ChangePasswordPage';
import { authApiService } from '../services/auth.api';

vi.mock('../services/auth.api', () => ({
  authApiService: {
    changePassword: vi.fn(),
  },
}));

const toastSuccess = vi.fn();
vi.mock('react-toastify', () => ({
  toast: { success: (...args: unknown[]) => toastSuccess(...args) },
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/change-password']}>
        <ChangePasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a success toast after a successful change and resets the form', async () => {
    (authApiService.changePassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    renderPage();

    await userEvent.type(screen.getByLabelText('Current password'), 'OldPass1');
    await userEvent.type(screen.getByLabelText('New password'), 'NewPass1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'NewPass1');
    await userEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Password changed successfully.', {
        position: 'top-right',
      }),
    );
  });

  it('maps CURRENT_PASSWORD_INVALID to the current password field', async () => {
    (authApiService.changePassword as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({
        status: 400,
        code: 'CURRENT_PASSWORD_INVALID',
        message: 'Current password is incorrect.',
      }),
    );
    renderPage();

    await userEvent.type(screen.getByLabelText('Current password'), 'WrongPass1');
    await userEvent.type(screen.getByLabelText('New password'), 'NewPass1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'NewPass1');
    await userEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('shows a client-side error when confirmation does not match, without calling the API', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Current password'), 'OldPass1');
    await userEvent.type(screen.getByLabelText('New password'), 'NewPass1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'Mismatch1');
    await userEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(authApiService.changePassword).not.toHaveBeenCalled();
  });
});
