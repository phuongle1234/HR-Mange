import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '../../../store/auth/auth.slice';
import { FrontendApiError } from '../../../shared/api/api-error';
import { LoginPage } from './LoginPage';
import { authApiService } from '../services/auth.api';

vi.mock('../services/auth.api', () => ({
  authApiService: {
    login: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLoginPage() {
  const store = configureStore({ reducer: { auth: authReducer } });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors when submitted empty', async () => {
    renderLoginPage();

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    expect(authApiService.login).not.toHaveBeenCalled();
  });

  it('shows a generic error on INVALID_CREDENTIALS and never renders the raw backend message', async () => {
    (authApiService.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new FrontendApiError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'raw backend message',
      }),
    );

    renderLoginPage();
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
    expect(screen.queryByText('raw backend message')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('stores the session and navigates to /employees on successful login', async () => {
    (authApiService.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      accessToken: 'token-abc',
      user: { id: '1', email: 'user@example.com', fullName: 'User Example' },
    });

    renderLoginPage();
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-password');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() =>
      expect(authApiService.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'correct-password',
      }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/employees', { replace: true }));
  });
});
