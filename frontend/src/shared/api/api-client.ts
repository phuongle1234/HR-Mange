import axios from 'axios';
import { store } from '../../store';
import { clearAuth } from '../../store/auth/auth.slice';
import { clearStoredToken } from '../auth/token-storage';
import { HttpStatus } from './http-status';
import { normalizeApiError } from './api-error';

const DEFAULT_TIMEOUT_MS = 10000;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach the Bearer token from the Redux auth store.
// Never read the token in page components — this is the single attach point.
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Response interceptor: normalize every error into a FrontendApiError.
// On 401 (no refresh token in this phase), clear the stored session so
// AuthGuard reactively redirects to /login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);

    if (normalized.status === HttpStatus.UNAUTHORIZED) {
      clearStoredToken();
      store.dispatch(clearAuth());
    }

    return Promise.reject(normalized);
  },
);
