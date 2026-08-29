import type { NotificationType, WorkflowAction, WorkflowRequestStatus } from '../shared/workflow-contract.types';

export const WORKFLOW_REQUEST_CREATED_EVENT = 'workflow.request.created';
export const WORKFLOW_REQUEST_APPROVED_EVENT = 'workflow.request.approved';
export const WORKFLOW_REQUEST_FEEDBACK_EVENT = 'workflow.request.feedback';
export const WORKFLOW_REQUEST_REJECTED_EVENT = 'workflow.request.rejected';
export const WORKFLOW_REQUEST_CANCELLED_EVENT = 'workflow.request.cancelled';
export const WORKFLOW_REQUEST_RESUBMITTED_EVENT = 'workflow.request.resubmitted';
export const WORKFLOW_REQUEST_COMPLETED_EVENT = 'workflow.request.completed';
export const NOTIFICATION_CREATED_EVENT = 'notification.created';

export class WorkflowRequestEvent {
  constructor(
    readonly workflowRequestId: string,
    readonly workflowId: string,
    readonly action: WorkflowAction,
    readonly status: WorkflowRequestStatus,
    readonly actorEmployeeId: string,
    readonly previousStepId: string | null,
    readonly currentStepId: string | null,
    readonly occurredAt: Date,
  ) {}
}

export class NotificationCreatedEvent {
  constructor(
    readonly notificationId: string,
    readonly recipientEmployeeId: string,
    readonly type: NotificationType,
    readonly referenceId: string | null,
    readonly occurredAt: Date,
  ) {}
}
