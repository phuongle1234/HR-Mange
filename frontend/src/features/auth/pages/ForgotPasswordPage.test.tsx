import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FrontendApiError } from '../../../shared/api/api-error';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { authApiService } from '../services/auth.api';

vi.mock('../services/auth.api', () => ({
  authApiService: {
    forgotPassword: vi.fn(),
  },
}));

const SAFE_MESSAGE = 'If the email is registered, password reset instructions will be sent.';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/forgot-password']}>
        <ForgotPasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the safe accepted message on success', async () => {
    (authApiService.forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    renderPage();
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send instructions' }));

    expect(await screen.findByRole('status')).toHaveTextContent(SAFE_MESSAGE);
  });

  it('shows the exact same safe message on an unexpected failure (never reveals whether the email exists)', async () => {
    (authApiService.forgotPassword as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'raw' }),
    );

    renderPage();
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send instructions' }));

    expect(await screen.findByRole('status')).toHaveTextContent(SAFE_MESSAGE);
  });

  it('shows a field error for VALIDATION_ERROR instead of the accepted message', async () => {
    (authApiService.forgotPassword as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fieldErrors: { email: ['Enter a valid email address'] },
      }),
    );

    renderPage();
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send instructions' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
