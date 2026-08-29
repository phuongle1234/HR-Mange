import { Employee, Organization, WorkflowRequest, WorkflowRequestStatus, WorkflowStep } from '@prisma/client';
import { MAX_CHAIN_LENGTH } from './workflow-step-chain.util';

/**
 * THE single implementation of the approver-authority rule (contract 4).
 *
 * WORK-029's action engine imports these functions rather than reimplementing
 * the rule. Two copies of an authorization rule is a security bug, not a
 * duplication nit: they drift, and the drift is invisible until someone
 * approves something they should not have been able to see.
 *
 * Why authority is organization-scoped rather than person-scoped: the schema
 * has no manager/lead/head field anywhere, and OrganizationType has no
 * level/rank column, so "who is this employee's Team Lead" is not answerable
 * as a person lookup. Authority is therefore derived from the org tree.
 *
 * Nothing here references a role NAME. `WorkflowStep.name` is a display label
 * only; hard-coding TEAM_LEAD / MANAGER / DEPARTMENT_MANAGER is forbidden.
 */

/** Minimal organization shape this module needs; keeps callers free to select narrowly. */
export type OrganizationScopeNode = Pick<Organization, 'id' | 'parentId' | 'organizationTypeId'>;

export type ActorEmployee = Pick<Employee, 'id' | 'organizationId'>;

export interface WorkflowRequestPermissions {
  canApprove: boolean;
  canFeedback: boolean;
  canReject: boolean;
  canCancel: boolean;
  canResubmit: boolean;
}

export const NO_WORKFLOW_PERMISSIONS: WorkflowRequestPermissions = {
  canApprove: false,
  canFeedback: false,
  canReject: false,
  canCancel: false,
  canResubmit: false,
};

const TERMINAL_STATUSES: WorkflowRequestStatus[] = ['APPROVED', 'REJECTED', 'CANCELLED'];

export function isTerminalStatus(status: WorkflowRequestStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Walks `parentId` upward from the requester's organization, returning
 * [self, parent, grandparent, ...].
 *
 * The walk is bounded by MAX_CHAIN_LENGTH and a visited set because the
 * schema permits a cyclic parentId - an unbounded walk would hang the
 * request thread rather than fail. An over-long chain yields a truncated
 * result, which denies authority rather than granting it.
 */
export function resolveOrganizationAncestry(
  organizationId: number | null,
  organizationsById: Map<number, OrganizationScopeNode>,
): OrganizationScopeNode[] {
  if (organizationId === null) return [];

  const chain: OrganizationScopeNode[] = [];
  const visited = new Set<number>();
  let current = organizationsById.get(organizationId);

  while (current && chain.length < MAX_CHAIN_LENGTH) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    chain.push(current);
    current = current.parentId === null ? undefined : organizationsById.get(current.parentId);
  }

  return chain;
}

/**
 * Contract 4.1: the actor may act at `step` when the actor's organization has
 * exactly the step's organizationTypeId AND is an ancestor-or-self of the
 * requester's organization.
 *
 * Both halves are required. The type match alone would let a Team Lead in an
 * unrelated department approve this request; the ancestry match alone would
 * let anyone in the reporting line approve at any level.
 */
export function canActAtStep(
  actor: ActorEmployee,
  requesterOrganizationId: number | null,
  step: Pick<WorkflowStep, 'organizationTypeId'> | null,
  organizationsById: Map<number, OrganizationScopeNode>,
): boolean {
  if (!step) return false;
  if (actor.organizationId === null) return false;

  const actorOrganization = organizationsById.get(actor.organizationId);
  if (!actorOrganization) return false;
  if (actorOrganization.organizationTypeId !== step.organizationTypeId) return false;

  const ancestry = resolveOrganizationAncestry(requesterOrganizationId, organizationsById);
  return ancestry.some((node) => node.id === actorOrganization.id);
}

/**
 * Computes the per-actor `permissions` object returned with every request
 * (contract 5.6). This is a UX convenience for hiding buttons - the action
 * engine re-validates every action server-side regardless (brief 34).
 */
export function resolveWorkflowRequestPermissions(
  actor: ActorEmployee | null,
  request: Pick<WorkflowRequest, 'employeeId' | 'status'>,
  requesterOrganizationId: number | null,
  currentStep: Pick<WorkflowStep, 'organizationTypeId'> | null,
  organizationsById: Map<number, OrganizationScopeNode>,
): WorkflowRequestPermissions {
  if (!actor) return NO_WORKFLOW_PERMISSIONS;
  if (isTerminalStatus(request.status)) return NO_WORKFLOW_PERMISSIONS;

  const isRequester = actor.id === request.employeeId;

  // Requester-only actions ignore organization entirely.
  const canCancel = isRequester && (request.status === 'IN_PROGRESS' || request.status === 'NEEDS_REVISION');
  const canResubmit = isRequester && request.status === 'NEEDS_REVISION';

  // Approver actions are only legal while the request is actually awaiting a
  // decision; in NEEDS_REVISION the ball is with the requester.
  const canReview =
    request.status === 'IN_PROGRESS' &&
    canActAtStep(actor, requesterOrganizationId, currentStep, organizationsById);

  return {
    canApprove: canReview,
    canFeedback: canReview,
    canReject: canReview,
    canCancel,
    canResubmit,
  };
}
