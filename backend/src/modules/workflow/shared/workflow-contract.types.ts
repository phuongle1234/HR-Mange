export type WorkflowRequestStatus = 'DRAFT' | 'IN_PROGRESS' | 'NEEDS_REVISION' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type WorkflowAction = 'SUBMIT' | 'RESUBMIT' | 'REVIEW' | 'APPROVE' | 'FEEDBACK' | 'REJECT' | 'CANCEL';
export type NotificationType =
  | 'WORKFLOW_REQUEST_SUBMITTED'
  | 'WORKFLOW_REQUEST_APPROVED'
  | 'WORKFLOW_REQUEST_FEEDBACK'
  | 'WORKFLOW_REQUEST_REJECTED'
  | 'WORKFLOW_REQUEST_COMPLETED'
  | 'WORKFLOW_REQUEST_CANCELLED';

export interface WorkflowFormSchema {
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox';
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
  }>;
}

export interface WorkflowEntity {
  id: string;
  code: string;
  name: string;
  formSchema: WorkflowFormSchema;
}

export interface WorkflowStepEntity {
  id: string;
  workflowId: string;
  parentId: string | null;
  name: string;
  organizationTypeId: string;
  stepOrder: number;
}

export interface EmployeeEntity {
  id: string;
  userId?: string | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  organizationId: number | null;
}

export interface OrganizationEntity {
  id: number;
  parentId: number | null;
  organizationTypeId: string | null;
}

export interface WorkflowRequestEntity {
  id: string;
  workflowId: string;
  workflow?: WorkflowEntity;
  employeeId: string;
  employee?: EmployeeEntity;
  currentStepId: string | null;
  currentStep?: WorkflowStepEntity | null;
  status: WorkflowRequestStatus;
  formData: Record<string, unknown>;
  revision: number;
  submittedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowRequestResponse extends WorkflowRequestEntity {
  permissions: {
    canApprove: boolean;
    canFeedback: boolean;
    canReject: boolean;
    canCancel: boolean;
    canResubmit: boolean;
  };
}

export interface NotificationEntity {
  id: string;
  recipientEmployeeId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: Date;
}
