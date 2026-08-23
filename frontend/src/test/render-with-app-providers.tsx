import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import authReducer, { type AuthState } from '../store/auth/auth.slice';

const AUTHENTICATED_STATE: AuthState = {
  accessToken: 'test-token',
  authStatus: 'authenticated',
  currentUser: { id: 'user-1', email: 'admin@example.com', fullName: 'Admin User' },
  authError: null,
};

/**
 * Shared test harness: Redux (pre-authenticated by default) + a fresh
 * QueryClient (retries disabled) + MemoryRouter, mirroring the real
 * ReduxProvider -> QueryProvider -> AuthProvider -> RouterProvider tree
 * closely enough for page-level component tests.
 */
export function renderWithAppProviders(
  ui: ReactElement,
  options: { route?: string; authState?: Partial<AuthState> } = {},
) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { ...AUTHENTICATED_STATE, ...options.authState } },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return {
    store,
    queryClient,
    ...render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    ),
  };
}
