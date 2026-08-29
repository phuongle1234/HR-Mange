export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type WorkflowRequestStatus = 'DRAFT' | 'IN_PROGRESS' | 'NEEDS_REVISION' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type WorkflowAction = 'SUBMIT' | 'RESUBMIT' | 'REVIEW' | 'APPROVE' | 'FEEDBACK' | 'REJECT' | 'CANCEL';
export type NotificationType =
  | 'WORKFLOW_REQUEST_SUBMITTED'
  | 'WORKFLOW_REQUEST_APPROVED'
  | 'WORKFLOW_REQUEST_FEEDBACK'
  | 'WORKFLOW_REQUEST_REJECTED'
  | 'WORKFLOW_REQUEST_COMPLETED'
  | 'WORKFLOW_REQUEST_CANCELLED';
export type WorkflowFormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox';

export interface WorkflowFormFieldOption {
  label: string;
  value: string;
}

export interface WorkflowFormField {
  key: string;
  label: string;
  type: WorkflowFormFieldType;
  required: boolean;
  placeholder?: string;
  options?: WorkflowFormFieldOption[];
}

export interface WorkflowFormSchema {
  fields: WorkflowFormField[];
}

export interface Workflow {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  formSchema: WorkflowFormSchema;
  steps?: WorkflowStep[];
  status: WorkflowStatus;
  version: number;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  parentId: string | null;
  name: string;
  organizationTypeId: string;
  organizationTypeName?: string;
  stepOrder: number;
}

export interface WorkflowHistory {
  id: string;
  workflowRequestId: string;
  workflowStepId?: string | null;
  employeeId: string;
  employeeName?: string;
  action: WorkflowAction;
  comment?: string | null;
  createdAt: string;
}

export interface WorkflowRequestPermissionSet {
  canApprove?: boolean;
  canFeedback?: boolean;
  canReject?: boolean;
  canCancel?: boolean;
  canResubmit?: boolean;
}

export interface WorkflowRequest {
  id: string;
  workflowId: string;
  employeeId: string;
  employeeName?: string;
  currentStepId?: string | null;
  status: WorkflowRequestStatus;
  formData: Record<string, unknown>;
  revision: number;
  submittedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  workflow?: Workflow;
  history?: WorkflowHistory[];
  permissions?: WorkflowRequestPermissionSet;
}

export interface WorkflowListResponse {
  items: Workflow[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface WorkflowRequestListResponse {
  items: WorkflowRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    unreadCount?: number;
  };
}

export interface NotificationItem {
  id: string;
  recipientEmployeeId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    unreadCount: number;
  };
}

export interface WorkflowListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: WorkflowStatus;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface WorkflowRequestListQuery {
  scope: 'mine' | 'inbox';
  page?: number;
  limit?: number;
  status?: WorkflowRequestStatus;
  workflowId?: string;
  search?: string;
  sortBy?: 'submittedAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface WorkflowRequestActionPayload {
  action: 'approve' | 'feedback' | 'reject' | 'cancel' | 'resubmit';
  comment?: string;
  revision: number;
  formData?: Record<string, unknown>;
}

export interface WorkflowDraftFormValues {
  code: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  fields: WorkflowFormField[];
}
