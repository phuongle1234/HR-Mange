import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowGateway } from '../gateway/workflow.gateway';
import {
  NOTIFICATION_CREATED_EVENT,
  NotificationCreatedEvent,
  WORKFLOW_REQUEST_APPROVED_EVENT,
  WORKFLOW_REQUEST_CANCELLED_EVENT,
  WORKFLOW_REQUEST_COMPLETED_EVENT,
  WORKFLOW_REQUEST_CREATED_EVENT,
  WORKFLOW_REQUEST_FEEDBACK_EVENT,
  WORKFLOW_REQUEST_REJECTED_EVENT,
  WORKFLOW_REQUEST_RESUBMITTED_EVENT,
  WorkflowRequestEvent,
} from '../events/workflow-request.event';

const WORKFLOW_EVENTS = [
  WORKFLOW_REQUEST_CREATED_EVENT,
  WORKFLOW_REQUEST_APPROVED_EVENT,
  WORKFLOW_REQUEST_FEEDBACK_EVENT,
  WORKFLOW_REQUEST_REJECTED_EVENT,
  WORKFLOW_REQUEST_CANCELLED_EVENT,
  WORKFLOW_REQUEST_RESUBMITTED_EVENT,
];

export class WorkflowSocketListener {
  private readonly logger = new Logger(WorkflowSocketListener.name);

  constructor(private readonly gateway: WorkflowGateway) {}

  @OnEvent(WORKFLOW_EVENTS, { async: true })
  handleWorkflowEvent(payload: WorkflowRequestEvent): void {
    try {
      this.gateway.emitWorkflowRequestEvent(this.eventNameFor(payload), payload);
    } catch (error) {
      this.logger.warn(`Unable to emit workflow socket event: ${(error as Error).message}`);
    }
  }

  @OnEvent(WORKFLOW_REQUEST_COMPLETED_EVENT, { async: true })
  handleWorkflowCompleted(payload: WorkflowRequestEvent): void {
    try {
      this.gateway.emitWorkflowRequestEvent(WORKFLOW_REQUEST_COMPLETED_EVENT, payload);
    } catch (error) {
      this.logger.warn(`Unable to emit workflow completed socket event: ${(error as Error).message}`);
    }
  }

  @OnEvent(NOTIFICATION_CREATED_EVENT, { async: true })
  handleNotificationCreated(payload: NotificationCreatedEvent): void {
    try {
      this.gateway.emitNotificationCreated(payload);
    } catch (error) {
      this.logger.warn(`Unable to emit notification socket event: ${(error as Error).message}`);
    }
  }

  private eventNameFor(payload: WorkflowRequestEvent): string {
    return {
      SUBMIT: WORKFLOW_REQUEST_CREATED_EVENT,
      APPROVE: WORKFLOW_REQUEST_APPROVED_EVENT,
      FEEDBACK: WORKFLOW_REQUEST_FEEDBACK_EVENT,
      REJECT: WORKFLOW_REQUEST_REJECTED_EVENT,
      CANCEL: WORKFLOW_REQUEST_CANCELLED_EVENT,
      RESUBMIT: WORKFLOW_REQUEST_RESUBMITTED_EVENT,
      REVIEW: WORKFLOW_REQUEST_CREATED_EVENT,
    }[payload.action];
  }
}
