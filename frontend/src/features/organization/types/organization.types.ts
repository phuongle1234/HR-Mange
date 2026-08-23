/**
 * Kept as a const tuple + derived union type (not a TS `enum`), matching
 * `EmployeeStatus` in features/employee/types/employee.types.ts - real
 * `enum`s are non-erasable syntax and this project's tsconfig has
 * `erasableSyntaxOnly: true`.
 */
export const ORGANIZATION_TYPE_VALUES = ['COMPANY', 'BRANCH', 'DIVISION', 'DEPARTMENT', 'TEAM'] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPE_VALUES)[number];

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  COMPANY: 'Company',
  BRANCH: 'Branch',
  DIVISION: 'Division',
  DEPARTMENT: 'Department',
  TEAM: 'Team',
};

export interface OrganizationManager {
  id?: number;
  name: string;
  avatar?: string;
}

/**
 * Frontend Stage model - the source of truth for this screen (no backend
 * calls yet, see services/organization.api.ts). `isActive` is not part of
 * the model the task originally specified; it was added deliberately so the
 * Edit modal's Status field has something to read/write - see
 * docs/09-workflow/plans/organization-frontend-chart.md decision #1.
 */
export interface OrganizationStage {
  uiId: number;
  parentUiId: number | null;

  /** DB id, not required yet - populated once the real API is wired up. */
  id?: number;

  code: string;
  name: string;
  type: OrganizationType;
  description?: string;
  manager?: OrganizationManager;
  isActive?: boolean;
}
