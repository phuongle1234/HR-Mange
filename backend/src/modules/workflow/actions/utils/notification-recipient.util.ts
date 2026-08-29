import type { EmployeeEntity, NotificationType, WorkflowRequestEntity, WorkflowStepEntity } from '../../shared/workflow-contract.types';
import { canActAt, WorkflowPermissionDelegate } from './workflow-permission.util';

export interface NotificationRecipientDelegate extends WorkflowPermissionDelegate {
  employee: {
    findMany(args?: unknown): Promise<EmployeeEntity[]>;
  };
}

export interface NotificationDraft {
  recipientEmployeeId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string;
}

async function eligibleEmployees(delegate: NotificationRecipientDelegate, request: WorkflowRequestEntity, step: WorkflowStepEntity | null, actorEmployeeId: string): Promise<EmployeeEntity[]> {
  if (!step || !request.employee) {
    return [];
  }

  const employees = await delegate.employee.findMany({ where: { organizationId: { not: null } } });
  const recipients: EmployeeEntity[] = [];
  for (const employee of employees) {
    if (employee.id === actorEmployeeId) {
      continue;
    }
    if (await canActAt(delegate, employee, request.employee, step)) {
      recipients.push(employee);
    }
  }
  return recipients;
}

function requestTitle(type: NotificationType): string {
  switch (type) {
    case 'WORKFLOW_REQUEST_APPROVED':
      return 'Workflow request approved';
    case 'WORKFLOW_REQUEST_FEEDBACK':
      return 'Workflow request needs revision';
    case 'WORKFLOW_REQUEST_REJECTED':
      return 'Workflow request rejected';
    case 'WORKFLOW_REQUEST_COMPLETED':
      return 'Workflow request completed';
    case 'WORKFLOW_REQUEST_CANCELLED':
      return 'Workflow request cancelled';
    default:
      return 'Workflow request submitted';
  }
}

function toDrafts(recipients: EmployeeEntity[], type: NotificationType, workflowRequestId: string): NotificationDraft[] {
  return recipients.map((recipient) => ({
    recipientEmployeeId: recipient.id,
    type,
    title: requestTitle(type),
    message: requestTitle(type),
    referenceId: workflowRequestId,
  }));
}

export async function buildNotificationDrafts(delegate: NotificationRecipientDelegate, action: 'APPROVE' | 'FEEDBACK' | 'REJECT' | 'CANCEL' | 'RESUBMIT', request: WorkflowRequestEntity, newStep: WorkflowStepEntity | null, actorEmployeeId: string): Promise<NotificationDraft[]> {
  if (action === 'REJECT') {
    return request.employeeId === actorEmployeeId ? [] : toDrafts([request.employee].filter(Boolean) as EmployeeEntity[], 'WORKFLOW_REQUEST_REJECTED', request.id);
  }
  if (action === 'CANCEL') {
    return toDrafts(await eligibleEmployees(delegate, request, request.currentStep ?? null, actorEmployeeId), 'WORKFLOW_REQUEST_CANCELLED', request.id);
  }
  if (action === 'FEEDBACK' && request.status === 'NEEDS_REVISION') {
    return request.employeeId === actorEmployeeId ? [] : toDrafts([request.employee].filter(Boolean) as EmployeeEntity[], 'WORKFLOW_REQUEST_FEEDBACK', request.id);
  }
  if (action === 'APPROVE' && !newStep) {
    return request.employeeId === actorEmployeeId ? [] : toDrafts([request.employee].filter(Boolean) as EmployeeEntity[], 'WORKFLOW_REQUEST_COMPLETED', request.id);
  }

  const type: NotificationType = action === 'RESUBMIT' ? 'WORKFLOW_REQUEST_SUBMITTED' : action === 'FEEDBACK' ? 'WORKFLOW_REQUEST_FEEDBACK' : 'WORKFLOW_REQUEST_APPROVED';
  return toDrafts(await eligibleEmployees(delegate, request, newStep, actorEmployeeId), type, request.id);
}
