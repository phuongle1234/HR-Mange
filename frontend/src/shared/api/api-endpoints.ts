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
    invitationAccept: () => '/api/auth/invitations/accept',
  },
  employees: {
    list: () => '/api/employees',
    detail: (id: string) => `/api/employees/${encodeURIComponent(id)}`,
    create: () => '/api/employees',
    update: (id: string) => `/api/employees/${encodeURIComponent(id)}`,
    delete: (id: string) => `/api/employees/${encodeURIComponent(id)}`,
    byIds: () => '/api/employees/by-ids',
    bulkCreate: () => '/api/employees/bulk',
    bulkUpdate: () => '/api/employees/bulk',
    bulkDelete: () => '/api/employees/bulk',
  },
  organizations: {
    list: () => '/api/organizations',
    createMany: () => '/api/organizations',
    updateMany: () => '/api/organizations',
    deleteMany: () => '/api/organizations',
  },
  organizationTypes: {
    list: () => '/api/organization-types',
    byIds: () => '/api/organization-types/by-ids',
    createMany: () => '/api/organization-types',
    updateMany: () => '/api/organization-types',
    deleteMany: () => '/api/organization-types',
  },
  invitations: {
    create: () => '/api/invitations',
    accept: () => '/api/auth/invitations/accept',
  },
  workflows: {
    list: () => '/api/workflows',
    detail: (id: string) => `/api/workflows/${encodeURIComponent(id)}`,
    create: () => '/api/workflows',
    update: (id: string) => `/api/workflows/${encodeURIComponent(id)}`,
    replaceSteps: (id: string) => `/api/workflows/${encodeURIComponent(id)}/steps`,
  },
  workflowRequests: {
    list: () => '/api/workflow-requests',
    detail: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}`,
    histories: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/histories`,
    create: () => '/api/workflow-requests',
    approve: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/approve`,
    feedback: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/feedback`,
    reject: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/reject`,
    cancel: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/cancel`,
    resubmit: (id: string) => `/api/workflow-requests/${encodeURIComponent(id)}/resubmit`,
  },
  notifications: {
    list: () => '/api/notifications',
    read: (id: string) => `/api/notifications/${encodeURIComponent(id)}/read`,
    readAll: () => '/api/notifications/read-all',
  },
} as const;
