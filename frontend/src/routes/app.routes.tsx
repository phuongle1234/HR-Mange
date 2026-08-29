import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { NotFoundLayout } from '../layouts/NotFoundLayout';
import { AuthGuard } from './guards/AuthGuard';
import { PublicOnlyGuard } from './guards/PublicOnlyGuard';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ChangePasswordPage } from '../features/auth/pages/ChangePasswordPage';
import { InvitationAcceptPage } from '../features/auth/pages/InvitationAcceptPage';
import { EmployeeListPage } from '../features/employee/pages/EmployeeListPage';
import { EmployeeDetailPage } from '../features/employee/pages/EmployeeDetailPage';
import { EmployeeCreatePage } from '../features/employee/pages/EmployeeCreatePage';
import { EmployeeUpdatePage } from '../features/employee/pages/EmployeeUpdatePage';
import { EmployeeEditPage } from '../features/employee/pages/EmployeeEditPage';
import { OrganizationPage } from '../features/organization/pages/OrganizationPage';
import { OrganizationTypeCreatePage } from '../features/organization-type/pages/OrganizationTypeCreatePage';
import { OrganizationTypeListPage } from '../features/organization-type/pages/OrganizationTypeListPage';
import { OrganizationTypeUpdatePage } from '../features/organization-type/pages/OrganizationTypeUpdatePage';
import { NotFoundPage } from '../shared/components/NotFoundPage';
import { WorkflowListPage } from '../features/workflow/pages/WorkflowListPage';
import { WorkflowCreatePage } from '../features/workflow/pages/WorkflowCreatePage';
import { WorkflowEditPage } from '../features/workflow/pages/WorkflowEditPage';
import { WorkflowRequestSubmitPage } from '../features/workflow/pages/WorkflowRequestSubmitPage';
import { MyRequestsPage } from '../features/workflow/pages/MyRequestsPage';
import { ReviewerInboxPage } from '../features/workflow/pages/ReviewerInboxPage';
import { WorkflowRequestDetailPage } from '../features/workflow/pages/WorkflowRequestDetailPage';
import type { RouteHandle } from './route.types';

const EMPLOYEE_BREADCRUMB_ROOT = { label: 'Employee', to: '/employees' };
const EMPLOYEE_LIST_BREADCRUMB = { label: 'Employee List', to: '/employees' };
const ORGANIZATION_BREADCRUMB_ROOT = { label: 'Organization', to: '/organizations' };
const ORGANIZATION_TYPE_BREADCRUMB = { label: 'Organization Types', to: '/organizations/types' };

function handle(value: RouteHandle): RouteHandle {
  return value;
}

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
        path: '/change-password',
        element: <ChangePasswordPage />,
        handle: handle({ title: 'Change Password', navbarBackButton: true, navbarBackTarget: '/employees', sidebarActiveKey: null }),
      },
      {
        path: '/invitation/accept',
        element: <InvitationAcceptPage />,
        handle: handle({ title: 'Accept Invitation', navbarBackButton: false, sidebarActiveKey: null }),
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
            handle: handle({ title: 'Employees', sidebarActiveKey: 'employee.list', breadcrumb: [EMPLOYEE_BREADCRUMB_ROOT, { label: 'Employee List' }] }),
          },
          {
            path: '/employees/create',
            element: <EmployeeCreatePage />,
            handle: handle({ title: 'Create Employee', navbarBackButton: true, navbarBackTarget: '/employees', sidebarActiveKey: 'employee.create', breadcrumb: [EMPLOYEE_BREADCRUMB_ROOT, { label: 'Create Employee' }] }),
          },
          {
            path: '/employees/update',
            element: <EmployeeUpdatePage />,
            handle: handle({ title: 'Update Employees', navbarBackButton: true, navbarBackTarget: '/employees', sidebarActiveKey: 'employee.list', breadcrumb: [EMPLOYEE_BREADCRUMB_ROOT, { label: 'Update Employees' }] }),
          },
          {
            path: '/employees/:id',
            element: <EmployeeDetailPage />,
            handle: handle({ title: 'Employee Detail', navbarBackButton: true, navbarBackTarget: '/employees', sidebarActiveKey: 'employee.list', breadcrumb: [EMPLOYEE_BREADCRUMB_ROOT, EMPLOYEE_LIST_BREADCRUMB, { label: 'Detail' }] }),
          },
          {
            path: '/employees/:id/edit',
            element: <EmployeeEditPage />,
            handle: handle({ title: 'Edit Employee', navbarBackButton: true, navbarBackTarget: '/employees/:id', sidebarActiveKey: 'employee.list', breadcrumb: [EMPLOYEE_BREADCRUMB_ROOT, EMPLOYEE_LIST_BREADCRUMB, { label: 'Detail' }, { label: 'Edit' }] }),
          },
          {
            path: '/organizations',
            element: <OrganizationPage />,
            handle: handle({ title: 'Organization', sidebarActiveKey: 'organization.chart', breadcrumb: [{ label: '' }] }),
          },
          {
            path: '/organizations/types',
            element: <OrganizationTypeListPage />,
            handle: handle({ title: 'Organization Types', sidebarActiveKey: 'organization.types', breadcrumb: [ORGANIZATION_BREADCRUMB_ROOT, { label: 'Organization Types' }] }),
          },
          {
            path: '/organizations/types/create',
            element: <OrganizationTypeCreatePage />,
            handle: handle({ title: 'Create Organization Types', navbarBackButton: true, navbarBackTarget: '/organizations/types', sidebarActiveKey: 'organization.types', breadcrumb: [ORGANIZATION_BREADCRUMB_ROOT, ORGANIZATION_TYPE_BREADCRUMB, { label: 'Create' }] }),
          },
          {
            path: '/organizations/types/update',
            element: <OrganizationTypeUpdatePage />,
            handle: handle({ title: 'Update Organization Types', navbarBackButton: true, navbarBackTarget: '/organizations/types', sidebarActiveKey: 'organization.types', breadcrumb: [ORGANIZATION_BREADCRUMB_ROOT, ORGANIZATION_TYPE_BREADCRUMB, { label: 'Update' }] }),
          },
          {
            path: '/workflows',
            element: <WorkflowListPage />,
            handle: handle({ title: 'Workflows', sidebarActiveKey: 'workflow.list', breadcrumb: [{ label: 'Workflows' }] }),
          },
          {
            path: '/workflows/create',
            element: <WorkflowCreatePage />,
            handle: handle({ title: 'Create Workflow', navbarBackButton: true, navbarBackTarget: '/workflows', sidebarActiveKey: 'workflow.create', breadcrumb: [{ label: 'Workflows', to: '/workflows' }, { label: 'Create' }] }),
          },
          {
            path: '/workflows/:id/edit',
            element: <WorkflowEditPage />,
            handle: handle({ title: 'Edit Workflow', navbarBackButton: true, navbarBackTarget: '/workflows', sidebarActiveKey: 'workflow.list', breadcrumb: [{ label: 'Workflows', to: '/workflows' }, { label: 'Edit' }] }),
          },
          {
            path: '/workflow-requests/new',
            element: <WorkflowRequestSubmitPage />,
            handle: handle({ title: '', navbarBackButton: true, navbarBackTarget: '/workflow-requests', sidebarActiveKey: 'workflow.requests', breadcrumb: [{ label: 'My Requests', to: '/workflow-requests' }, { label: 'New Request' }] }),
          },
          {
            path: '/workflow-requests',
            element: <MyRequestsPage />,
            handle: handle({ title: 'My Requests', sidebarActiveKey: 'workflow.requests', breadcrumb: [{ label: 'My Requests' }] }),
          },
          {
            path: '/workflow-requests/inbox',
            element: <ReviewerInboxPage />,
            handle: handle({ title: 'Reviewer Inbox', sidebarActiveKey: 'workflow.inbox', breadcrumb: [{ label: 'Reviewer Inbox' }] }),
          },
          {
            path: '/workflow-requests/:id',
            element: <WorkflowRequestDetailPage />,
            handle: handle({ title: 'Workflow Request Detail', navbarBackButton: true, navbarBackTarget: '/workflow-requests', sidebarActiveKey: 'workflow.requests', breadcrumb: [{ label: 'My Requests', to: '/workflow-requests' }, { label: 'Detail' }] }),
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
