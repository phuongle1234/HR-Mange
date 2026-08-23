import type { OrganizationStage } from '../types/organization.types';

/** `max(...allUiIds) + 1`, or `1` if the stage is empty - per task §4. */
export function generateNextUiId(organizations: OrganizationStage[]): number {
  if (organizations.length === 0) {
    return 1;
  }
  return Math.max(...organizations.map((item) => item.uiId)) + 1;
}

export function findOrganization(
  uiId: number,
  organizations: OrganizationStage[],
): OrganizationStage | undefined {
  return organizations.find((item) => item.uiId === uiId);
}

export function countChildren(uiId: number, organizations: OrganizationStage[]): number {
  return organizations.filter((item) => item.parentUiId === uiId).length;
}

/** Recursively collects every descendant `uiId` of `uiId` (not including itself). */
export function findDescendantUiIds(uiId: number, organizations: OrganizationStage[]): Set<number> {
  const descendants = new Set<number>();
  const queue = [uiId];

  while (queue.length > 0) {
    const currentUiId = queue.shift() as number;
    for (const item of organizations) {
      if (item.parentUiId === currentUiId && !descendants.has(item.uiId)) {
        descendants.add(item.uiId);
        queue.push(item.uiId);
      }
    }
  }

  return descendants;
}

/**
 * Task §17/§18: deleting a node removes it and every descendant, leaving no
 * orphans. Immutable - returns a new array, never mutates `organizations`.
 */
export function removeOrganizationTree(
  uiId: number,
  organizations: OrganizationStage[],
): OrganizationStage[] {
  const descendantUiIds = findDescendantUiIds(uiId, organizations);
  return organizations.filter((item) => item.uiId !== uiId && !descendantUiIds.has(item.uiId));
}

/**
 * There is no Move action in this task (Note 4), so this is never called
 * yet - written now so a future Move feature can reuse it instead of
 * re-deriving cycle detection. Returns true if making `uiId`'s parent
 * `candidateParentUiId` would create a cycle (i.e. `candidateParentUiId` is
 * `uiId` itself or one of its own descendants).
 */
export function wouldCreateCycle(
  uiId: number,
  candidateParentUiId: number,
  organizations: OrganizationStage[],
): boolean {
  if (uiId === candidateParentUiId) {
    return true;
  }
  return findDescendantUiIds(uiId, organizations).has(candidateParentUiId);
}
