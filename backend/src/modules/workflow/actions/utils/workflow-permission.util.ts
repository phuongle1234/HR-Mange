import type { EmployeeEntity, OrganizationEntity, WorkflowRequestEntity, WorkflowStepEntity } from '../../shared/workflow-contract.types';

const MAX_ORG_DEPTH = 20;

export interface WorkflowPermissionDelegate {
  organization: {
    findUnique(args: unknown): Promise<OrganizationEntity | null>;
    findMany(args?: unknown): Promise<OrganizationEntity[]>;
  };
}

export async function canActAt(delegate: WorkflowPermissionDelegate, actor: EmployeeEntity, requester: EmployeeEntity, step: WorkflowStepEntity): Promise<boolean> {
  if (actor.organizationId == null || requester.organizationId == null) {
    return false;
  }

  const actorOrg = await delegate.organization.findUnique({ where: { id: actor.organizationId } });
  if (!actorOrg || actorOrg.organizationTypeId !== step.organizationTypeId) {
    return false;
  }

  let cursor: number | null = requester.organizationId;
  for (let depth = 0; cursor !== null && depth < MAX_ORG_DEPTH; depth += 1) {
    if (cursor === actorOrg.id) {
      return true;
    }
    const org = await delegate.organization.findUnique({ where: { id: cursor } });
    cursor = org?.parentId ?? null;
  }

  return false;
}

export function computeWorkflowPermissions(actor: EmployeeEntity, request: WorkflowRequestEntity, canActAtCurrentStep: boolean) {
  const isRequester = actor.id === request.employeeId;
  const isInProgress = request.status === 'IN_PROGRESS';
  const needsRevision = request.status === 'NEEDS_REVISION';

  return {
    canApprove: isInProgress && canActAtCurrentStep,
    canFeedback: isInProgress && canActAtCurrentStep,
    canReject: isInProgress && canActAtCurrentStep,
    canCancel: isRequester && (isInProgress || needsRevision),
    canResubmit: isRequester && needsRevision,
  };
}
