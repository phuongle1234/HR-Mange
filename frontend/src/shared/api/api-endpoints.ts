/**
 * Centralized endpoint path builder. Components/services must never
 * hard-code `/api/...` — every path used by a feature service comes from here.
 * `apiClient`'s `baseURL` (VITE_API_BASE_URL) is prepended by Axios itself,
 * so paths declared here are relative (start with `/api`).
 */
export const ApiEndpoints = {
  auth: {
    login: () => '/api/auth/login',
    me: () => '/api/auth/me',
    logout: () => '/api/auth/logout',
    changePassword: () => '/api/auth/change-password',
    forgotPassword: () => '/api/auth/forgot-password',
  },
  employees: {
    list: () => '/api/employees',
    detail: (id: string) => `/api/employees/${encodeURIComponent(id)}`,
    create: () => '/api/employees',
    update: (id: string) => `/api/employees/${encodeURIComponent(id)}`,
    delete: (id: string) => `/api/employees/${encodeURIComponent(id)}`,
  },
} as const;
