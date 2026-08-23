import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from '../store';
import { AuthProvider } from '../providers/AuthProvider';
import { router } from '../routes/app.routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Provider tree, per docs/07-frontend/architecture.md:
 * ReduxProvider -> QueryProvider -> AuthProvider -> RouterProvider.
 * There is no PermissionProvider (WORK-000 decision #2).
 */
export function App() {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
        <ToastContainer position="top-right" />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
