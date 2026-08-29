import type { NotificationItem, Workflow, WorkflowRequest, WorkflowStep } from '../../types/workflow.types';

export const mockWorkflowSteps: WorkflowStep[] = [
  {
    id: 'step-1',
    workflowId: 'workflow-leave',
    parentId: null,
    name: 'Employee',
    organizationTypeId: 'org-type-employee',
    organizationTypeName: 'Employee',
    stepOrder: 1,
  },
  {
    id: 'step-2',
    workflowId: 'workflow-leave',
    parentId: 'step-1',
    name: 'Team Lead',
    organizationTypeId: 'org-type-team-lead',
    organizationTypeName: 'Team Lead',
    stepOrder: 2,
  },
  {
    id: 'step-3',
    workflowId: 'workflow-leave',
    parentId: 'step-2',
    name: 'Manager',
    organizationTypeId: 'org-type-manager',
    organizationTypeName: 'Manager',
    stepOrder: 3,
  },
];

export const mockWorkflowList: Workflow[] = [
  {
    id: 'workflow-leave',
    code: 'LEAVE_REQUEST',
    name: 'Leave Request',
    description: 'Approval chain for vacation and personal leave requests.',
    status: 'ACTIVE',
    version: 1,
    formSchema: {
      fields: [
        { key: 'employeeName', label: 'Employee Name', type: 'text', required: true, placeholder: 'Your full name' },
        { key: 'leaveType', label: 'Leave Type', type: 'select', required: true, options: [{ label: 'Annual Leave', value: 'annual' }, { label: 'Sick Leave', value: 'sick' }, { label: 'Personal Leave', value: 'personal' }] },
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'endDate', label: 'End Date', type: 'date', required: true },
        { key: 'notes', label: 'Reason', type: 'textarea', required: false, placeholder: 'Optional note' },
      ],
    },
    steps: mockWorkflowSteps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'workflow-expense',
    code: 'EXPENSE_APPROVAL',
    name: 'Expense Approval',
    description: 'Approval workflow for reimbursement requests.',
    status: 'DRAFT',
    version: 1,
    formSchema: {
      fields: [
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        { key: 'purpose', label: 'Purpose', type: 'text', required: true },
      ],
    },
    steps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockWorkflowRequests: WorkflowRequest[] = [
  {
    id: 'request-1',
    workflowId: 'workflow-leave',
    employeeId: 'emp-1',
    employeeName: 'Alice Nguyen',
    currentStepId: 'step-2',
    status: 'IN_PROGRESS',
    formData: {
      employeeName: 'Alice Nguyen',
      leaveType: 'annual',
      startDate: '2026-09-10',
      endDate: '2026-09-12',
      notes: 'Family trip',
    },
    revision: 1,
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workflow: mockWorkflowList[0],
    permissions: { canApprove: true, canReject: true, canFeedback: true, canCancel: false, canResubmit: false },
    history: [
      { id: 'hist-1', workflowRequestId: 'request-1', employeeId: 'emp-1', employeeName: 'Alice Nguyen', action: 'SUBMIT', createdAt: new Date().toISOString() },
      { id: 'hist-2', workflowRequestId: 'request-1', workflowStepId: 'step-1', employeeId: 'emp-1', employeeName: 'Alice Nguyen', action: 'APPROVE', comment: 'Approved by employee step.', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 'request-2',
    workflowId: 'workflow-leave',
    employeeId: 'emp-2',
    employeeName: 'Brian Tran',
    currentStepId: null,
    status: 'APPROVED',
    formData: { leaveType: 'sick', startDate: '2026-08-20', endDate: '2026-08-23' },
    revision: 3,
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workflow: mockWorkflowList[0],
    permissions: { canApprove: false, canFeedback: false, canReject: false, canCancel: false, canResubmit: false },
    history: [
      { id: 'hist-3', workflowRequestId: 'request-2', employeeId: 'emp-2', employeeName: 'Brian Tran', action: 'SUBMIT', createdAt: new Date().toISOString() },
      { id: 'hist-4', workflowRequestId: 'request-2', workflowStepId: 'step-3', employeeId: 'emp-2', employeeName: 'Brian Tran', action: 'APPROVE', comment: 'Completed', createdAt: new Date().toISOString() },
    ],
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    recipientEmployeeId: 'emp-1',
    type: 'WORKFLOW_REQUEST_FEEDBACK',
    title: 'Feedback received',
    message: 'Your leave request received feedback from Team Lead.',
    referenceId: 'request-1',
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    recipientEmployeeId: 'emp-1',
    type: 'WORKFLOW_REQUEST_APPROVED',
    title: 'Request approved',
    message: 'Your request was approved by the manager.',
    referenceId: 'request-2',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];
