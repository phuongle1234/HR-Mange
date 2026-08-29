import { WorkflowStep } from '@prisma/client';

/**
 * The approval chain is a LINKED LIST, not a tree: each step has at most one
 * child, and `parentId` is the ONLY chain source. `stepOrder` exists purely
 * for display/tiebreak and must never be used to compute the next step -
 * two sources of ordering would eventually disagree (contract 2.2).
 *
 * Because the list is linear, `parentId` is the unique predecessor, which is
 * exactly what makes "FEEDBACK descends one level" unambiguous (contract 7.3).
 */

/** Defensive cap: the data permits a cyclic parentId, so every walk is bounded. */
export const MAX_CHAIN_LENGTH = 20;

/** The first approver. `parentId === null` marks it. */
export function findRootStep(steps: WorkflowStep[]): WorkflowStep | undefined {
  return steps.find((step) => step.parentId === null);
}

/** The step that follows `stepId` when an approval moves up the chain. */
export function findChildStep(steps: WorkflowStep[], stepId: string): WorkflowStep | undefined {
  return steps.find((step) => step.parentId === stepId);
}

/**
 * Orders a workflow's steps root-first by walking `parentId` links.
 *
 * Any step not reachable from the root is appended afterwards (ordered by
 * `stepOrder`) rather than dropped: silently hiding an orphaned step would
 * make a misconfigured chain look correct in the UI.
 */
export function orderStepChain(steps: WorkflowStep[]): WorkflowStep[] {
  const root = findRootStep(steps);
  if (!root) return [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  const ordered: WorkflowStep[] = [];
  const visited = new Set<string>();
  let current: WorkflowStep | undefined = root;

  while (current && ordered.length < MAX_CHAIN_LENGTH) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    ordered.push(current);
    current = findChildStep(steps, current.id);
  }

  const unreachable = steps.filter((step) => !visited.has(step.id)).sort((a, b) => a.stepOrder - b.stepOrder);
  return [...ordered, ...unreachable];
}
