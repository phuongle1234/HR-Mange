import type { WorkflowRequestStatus, WorkflowStepEntity } from '../../shared/workflow-contract.types';

export interface WorkflowTransition {
  nextStepId: string | null;
  status: WorkflowRequestStatus;
  completedAt?: Date | null;
}

export function resolveApproveTransition(childStep: WorkflowStepEntity | null, now = new Date()): WorkflowTransition {
  if (childStep) {
    return { nextStepId: childStep.id, status: 'IN_PROGRESS', completedAt: null };
  }

  return { nextStepId: null, status: 'APPROVED', completedAt: now };
}

export function resolveFeedbackTransition(currentStep: WorkflowStepEntity): WorkflowTransition {
  return {
    nextStepId: currentStep.parentId ?? currentStep.id,
    status: currentStep.parentId ? 'IN_PROGRESS' : 'NEEDS_REVISION',
  };
}

export function resolveRejectTransition(now = new Date()): WorkflowTransition {
  return { nextStepId: null, status: 'REJECTED', completedAt: now };
}

export function resolveCancelTransition(now = new Date()): WorkflowTransition {
  return { nextStepId: null, status: 'CANCELLED', completedAt: now };
}

export function resolveResubmitTransition(rootStepId: string): WorkflowTransition {
  return { nextStepId: rootStepId, status: 'IN_PROGRESS', completedAt: null };
}
