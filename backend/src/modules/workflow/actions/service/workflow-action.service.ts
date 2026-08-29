import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseService } from '../../../../common/services/base.service';
import { PaginatedResult } from '../../../../common/interfaces/base.interface';
import { PrismaService } from '../../../../prisma/prisma.service';
import type { ApproveWorkflowRequestDto } from '../dto/approve-workflow-request.dto';
import type { CancelWorkflowRequestDto } from '../dto/cancel-workflow-request.dto';
import type { FeedbackWorkflowRequestDto } from '../dto/feedback-workflow-request.dto';
import type { RejectWorkflowRequestDto } from '../dto/reject-workflow-request.dto';
import type { ResubmitWorkflowRequestDto } from '../dto/resubmit-workflow-request.dto';
import { IWorkflowActionService, WorkflowActionServiceDelegate } from '../interfaces/workflow-action-service.interface';
import { buildNotificationDrafts } from '../utils/notification-recipient.util';
import { canActAt, computeWorkflowPermissions } from '../utils/workflow-permission.util';
import { validateWorkflowFormData } from '../utils/workflow-form-data.util';
import {
  resolveApproveTransition,
  resolveCancelTransition,
  resolveFeedbackTransition,
  resolveRejectTransition,
  resolveResubmitTransition,
  WorkflowTransition,
} from '../utils/workflow-transition.util';
import {
  NOTIFICATION_CREATED_EVENT,
  NotificationCreatedEvent,
  WORKFLOW_REQUEST_APPROVED_EVENT,
  WORKFLOW_REQUEST_CANCELLED_EVENT,
  WORKFLOW_REQUEST_COMPLETED_EVENT,
  WORKFLOW_REQUEST_FEEDBACK_EVENT,
  WORKFLOW_REQUEST_REJECTED_EVENT,
  WORKFLOW_REQUEST_RESUBMITTED_EVENT,
  WorkflowRequestEvent,
} from '../../events/workflow-request.event';
import {
  EmployeeEntity,
  NotificationEntity,
  WorkflowAction,
  WorkflowRequestEntity,
  WorkflowRequestResponse,
  WorkflowStepEntity,
} from '../../shared/workflow-contract.types';
import { WorkflowActionNotAllowedException, WorkflowRequestInvalidStateException, WorkflowRequestNotFoundException, WorkflowRequestStaleException } from '../../shared/workflow.exceptions';
import { WorkflowPrismaClient, workflowPrisma } from '../../shared/workflow-prisma.bridge';

type ActionName = 'APPROVE' | 'FEEDBACK' | 'REJECT' | 'CANCEL' | 'RESUBMIT';

interface TransactionResult {
  request: WorkflowRequestResponse;
  workflowEvent: WorkflowRequestEvent;
  eventName: string;
  completedEvent?: WorkflowRequestEvent;
  notifications: NotificationCreatedEvent[];
}

@Injectable()
export class WorkflowActionService extends BaseService<any, never> implements IWorkflowActionService {
  private readonly workflowDb: WorkflowPrismaClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowEvents: EventEmitter2,
  ) {
    const db = workflowPrisma(prisma);
    super(db.workflowRequest, workflowEvents, null, (id) => new WorkflowRequestNotFoundException(id));
    this.workflowDb = db;
  }

  async findMany(): Promise<PaginatedResult<WorkflowRequestEntity>> {
    const items = (await this.workflowDb.workflowRequest.findMany()) as WorkflowRequestEntity[];
    return { items, total: items.length };
  }

  approve(id: string, dto: ApproveWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse> {
    return this.runAction(id, 'APPROVE', dto.revision, dto.comment, actorUserId);
  }

  feedback(id: string, dto: FeedbackWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse> {
    return this.runAction(id, 'FEEDBACK', dto.revision, dto.comment, actorUserId);
  }

  reject(id: string, dto: RejectWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse> {
    return this.runAction(id, 'REJECT', dto.revision, dto.comment, actorUserId);
  }

  cancel(id: string, dto: CancelWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse> {
    return this.runAction(id, 'CANCEL', dto.revision, dto.comment, actorUserId);
  }

  resubmit(id: string, dto: ResubmitWorkflowRequestDto, actorUserId: string): Promise<WorkflowRequestResponse> {
    return this.runAction(id, 'RESUBMIT', dto.revision, dto.comment, actorUserId, dto.formData);
  }

  private async runAction(id: string, action: ActionName, expectedRevision: number, comment: string | undefined, actorUserId: string, formData?: Record<string, unknown>): Promise<WorkflowRequestResponse> {
    const result = await this.workflowDb.$transaction(async (tx): Promise<TransactionResult> => {
      const request = await this.findRequestForAction(tx, id);
      const actor = await this.findActorEmployee(tx, actorUserId);
      const currentStep = request.currentStep ?? null;
      const previousStepId = request.currentStepId;

      this.guardStatus(action, request);
      await this.guardAuthority(tx, action, actor, request, currentStep);

      const transition = await this.resolveTransition(tx, action, request, currentStep, formData);
      await tx.workflowHistory.create({ data: { workflowRequestId: id, workflowStepId: this.historyStepId(action, currentStep), employeeId: actor.id, action, comment: comment ?? null } });

      const updateData = this.buildUpdateData(action, transition, formData);
      const updateResult = await tx.workflowRequest.updateMany({ where: { id, revision: expectedRevision }, data: { ...updateData, revision: { increment: 1 } } });
      if (updateResult.count === 0) {
        throw new WorkflowRequestStaleException();
      }

      const updated = await this.findRequestForAction(tx, id);
      const newStep = updated.currentStep ?? null;
      const notifications = await buildNotificationDrafts(tx as any, action, { ...updated, currentStep: request.currentStep, status: updated.status }, newStep, actor.id);
      const createdNotifications = await Promise.all(notifications.map((notification) => tx.notification.create({ data: notification }) as Promise<NotificationEntity>));
      const canActAtCurrentStep = updated.currentStep ? await canActAt(tx as any, actor, updated.employee, updated.currentStep) : false;
      const response = { ...updated, permissions: computeWorkflowPermissions(actor, updated, canActAtCurrentStep) };
      const occurredAt = new Date();
      const workflowEvent = new WorkflowRequestEvent(updated.id, updated.workflowId, action as WorkflowAction, updated.status, actor.id, previousStepId, updated.currentStepId, occurredAt);

      return {
        request: response,
        workflowEvent,
        eventName: this.eventNameFor(action),
        completedEvent: updated.status === 'APPROVED' ? new WorkflowRequestEvent(updated.id, updated.workflowId, 'APPROVE', updated.status, actor.id, previousStepId, updated.currentStepId, occurredAt) : undefined,
        notifications: createdNotifications.map((notification) => new NotificationCreatedEvent(notification.id, notification.recipientEmployeeId, notification.type, notification.referenceId, occurredAt)),
      };
    });

    this.workflowEvents.emit(result.eventName, result.workflowEvent);
    if (result.completedEvent) {
      this.workflowEvents.emit(WORKFLOW_REQUEST_COMPLETED_EVENT, result.completedEvent);
    }
    result.notifications.forEach((event) => this.workflowEvents.emit(NOTIFICATION_CREATED_EVENT, event));

    return result.request;
  }

  private async findRequestForAction(tx: WorkflowPrismaClient, id: string): Promise<WorkflowRequestEntity> {
    const request = (await tx.workflowRequest.findUnique({ where: { id }, include: { workflow: true, employee: true, currentStep: true } })) as WorkflowRequestEntity | null;
    if (!request || !request.employee || !request.workflow) {
      throw new WorkflowRequestNotFoundException(id);
    }
    return request;
  }

  private async findActorEmployee(tx: WorkflowPrismaClient, actorUserId: string): Promise<EmployeeEntity> {
    const employee = (await tx.employee.findUnique({ where: { userId: actorUserId } })) as EmployeeEntity | null;
    if (!employee) {
      throw new WorkflowActionNotAllowedException();
    }
    return employee;
  }

  private guardStatus(action: ActionName, request: WorkflowRequestEntity): void {
    if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status)) {
      throw new WorkflowRequestInvalidStateException();
    }
    if (['APPROVE', 'FEEDBACK', 'REJECT'].includes(action) && request.status !== 'IN_PROGRESS') {
      throw new WorkflowRequestInvalidStateException();
    }
    if (action === 'RESUBMIT' && request.status !== 'NEEDS_REVISION') {
      throw new WorkflowRequestInvalidStateException();
    }
    if (action === 'CANCEL' && !['IN_PROGRESS', 'NEEDS_REVISION'].includes(request.status)) {
      throw new WorkflowRequestInvalidStateException();
    }
  }

  private async guardAuthority(tx: WorkflowPrismaClient, action: ActionName, actor: EmployeeEntity, request: WorkflowRequestEntity, currentStep: WorkflowStepEntity | null): Promise<void> {
    if (['CANCEL', 'RESUBMIT'].includes(action)) {
      if (actor.id !== request.employeeId) {
        throw new WorkflowActionNotAllowedException();
      }
      return;
    }
    if (!currentStep || !(await canActAt(tx as any, actor, request.employee, currentStep))) {
      throw new WorkflowActionNotAllowedException();
    }
  }

  private async resolveTransition(tx: WorkflowPrismaClient, action: ActionName, request: WorkflowRequestEntity, currentStep: WorkflowStepEntity | null, formData?: Record<string, unknown>): Promise<WorkflowTransition> {
    if (action === 'APPROVE') {
      const childSteps = (await tx.workflowStep.findMany({ where: { parentId: currentStep?.id }, orderBy: { stepOrder: 'asc' }, take: 1 })) as WorkflowStepEntity[];
      const childStep = childSteps[0] ?? null;
      return resolveApproveTransition(childStep);
    }
    if (action === 'FEEDBACK' && currentStep) return resolveFeedbackTransition(currentStep);
    if (action === 'REJECT') return resolveRejectTransition();
    if (action === 'CANCEL') return resolveCancelTransition();
    if (action === 'RESUBMIT') {
      validateWorkflowFormData(request.workflow.formSchema, formData ?? {});
      const rootSteps = (await tx.workflowStep.findMany({ where: { workflowId: request.workflowId, parentId: null }, orderBy: { stepOrder: 'asc' }, take: 1 })) as WorkflowStepEntity[];
      const rootStep = rootSteps[0] ?? null;
      if (!rootStep) throw new WorkflowRequestInvalidStateException();
      return resolveResubmitTransition(rootStep.id);
    }
    throw new WorkflowRequestInvalidStateException();
  }

  private historyStepId(action: ActionName, currentStep: WorkflowStepEntity | null): string | null {
    return ['SUBMIT', 'RESUBMIT', 'CANCEL'].includes(action) ? null : currentStep?.id ?? null;
  }

  private buildUpdateData(action: ActionName, transition: WorkflowTransition, formData?: Record<string, unknown>) {
    return {
      currentStepId: transition.nextStepId,
      status: transition.status,
      completedAt: transition.completedAt,
      ...(action === 'RESUBMIT' ? { formData } : {}),
    };
  }

  private eventNameFor(action: ActionName): string {
    return {
      APPROVE: WORKFLOW_REQUEST_APPROVED_EVENT,
      FEEDBACK: WORKFLOW_REQUEST_FEEDBACK_EVENT,
      REJECT: WORKFLOW_REQUEST_REJECTED_EVENT,
      CANCEL: WORKFLOW_REQUEST_CANCELLED_EVENT,
      RESUBMIT: WORKFLOW_REQUEST_RESUBMITTED_EVENT,
    }[action];
  }
}
