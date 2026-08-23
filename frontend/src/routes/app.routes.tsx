import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { NotFoundLayout } from '../layouts/NotFoundLayout';
import { AuthGuard } from './guards/AuthGuard';
import { PublicOnlyGuard } from './guards/PublicOnlyGuard';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ChangePasswordPage } from '../features/auth/pages/ChangePasswordPage';
import { EmployeeListPage } from '../features/employee/pages/EmployeeListPage';
import { EmployeeDetailPage } from '../features/employee/pages/EmployeeDetailPage';
import { EmployeeCreatePage } from '../features/employee/pages/EmployeeCreatePage';
import { EmployeeEditPage } from '../features/employee/pages/EmployeeEditPage';
import { OrganizationPage } from '../features/organization/pages/OrganizationPage';
import { NotFoundPage } from '../shared/components/NotFoundPage';
import type { RouteHandle } from './route.types';

const EMPLOYEE_BREADCRUMB_ROOT = { label: 'Employee', to: '/employees' };
const EMPLOYEE_LIST_BREADCRUMB = { label: 'Employee List', to: '/employees' };

function handle(value: RouteHandle): RouteHandle {
  return value;
}

/**
 * Central route table, per docs/07-frontend/react-route.md. Do not create
 * feature-specific route files — every route is declared here.
 */
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        element: <PublicOnlyGuard />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
            handle: handle({ title: 'Login', authSubtitle: 'Green Momentum' }),
          },
        ],
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
        handle: handle({ title: 'Forgot Password', authSubtitle: 'Account recovery' }),
      },
      {
        path: '/change-password', element: <ChangePasswordPage />,
        handle: handle({ title: 'Change Password', navbarBackButton: true, navbarBackTarget: '/employees', sidebarActiveKey: null, }),
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/employees',
            element: <EmployeeListPage />,
            handle: handle({
              title: 'Employees',
              sidebarActiveKey: 'employee.list',
              breadcrumb: [EMPLOYEE_BREADCRUMB_ROOT, { label: 'Employee List' }],
            }),
          },
          {
            path: '/employees/create',
            element: <EmployeeCreatePage />,
            handle: handle({
              title: 'Create Employee',
              navbarBackButton: true,
              navbarBackTarget: '/employees',
              sidebarActiveKey: 'employee.create',
              breadcrumb: [EMPLOYEE_BREADCRUMB_ROOT, { label: 'Create Employee' }],
            }),
          },
          {
            path: '/employees/:id',
            element: <EmployeeDetailPage />,
            handle: handle({
              title: 'Employee Detail',
              navbarBackButton: true,
              navbarBackTarget: '/employees',
              sidebarActiveKey: 'employee.list',
              breadcrumb: [EMPLOYEE_BREADCRUMB_ROOT, EMPLOYEE_LIST_BREADCRUMB, { label: 'Detail' }],
            }),
          },
          {
            path: '/employees/:id/edit',
            element: <EmployeeEditPage />,
            handle: handle({
              title: 'Edit Employee',
              navbarBackButton: true,
              navbarBackTarget: '/employees/:id',
              sidebarActiveKey: 'employee.list',
              breadcrumb: [
                EMPLOYEE_BREADCRUMB_ROOT,
                EMPLOYEE_LIST_BREADCRUMB,
                { label: 'Detail' },
                { label: 'Edit' },
              ],
            }),
          },
          {
            path: '/organizations',
            element: <OrganizationPage />,
            handle: handle({
              title: 'Organization',
              sidebarActiveKey: 'organization.chart',
              breadcrumb: [{ label: '' }],
            }),
          },
        ],
      },
    ],
  },
  {
    element: <NotFoundLayout />,
    children: [{ path: '*', element: <NotFoundPage /> }],
  },
]);
