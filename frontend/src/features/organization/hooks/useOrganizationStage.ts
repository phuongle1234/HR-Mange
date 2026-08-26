import { useCallback, useState } from 'react';
import type { OrganizationStage } from '../types/organization.types';
import type { CreateOrganizationFormItem, EditOrganizationFormValues } from '../schemas/organization.schemas';
import { findOrganization, removeOrganizationTree as removeTree } from '../utils/organization-tree';

export interface UseOrganizationStageResult {
  organizations: OrganizationStage[];
  addOrganizations: (items: CreateOrganizationFormItem[], parentUiId: number | null) => void;
  removeOrganizationTree: (uiId: number) => void;
  updateOrganization: (uiId: number, values: EditOrganizationFormValues) => void;
  getOrganization: (uiId: number) => OrganizationStage | undefined;
}

/**
 * Owns the "Frontend Stage" - the source of truth for this screen (task
 * §22). No persistence, no API calls; every mutation is an immutable
 * `setOrganizations` update built on top of utils/organization-tree.ts's
 * pure functions.
 */
export function useOrganizationStage(): UseOrganizationStageResult {
  const [organizations, setOrganizations] = useState<OrganizationStage[]>([]);

  const addOrganizations = useCallback(
    (items: CreateOrganizationFormItem[], parentUiId: number | null) => {
      setOrganizations((current) => {
        const maxUiId = Math.max(0, ...current.map((item) => item.uiId));
        const newOrganizations: OrganizationStage[] = items.map((item, index) => ({
          ...item,
          type: 'DEPARTMENT',
          uiId: maxUiId + index + 1,
          parentUiId,
        }));
        return [...current, ...newOrganizations];
      });
    },
    [],
  );

  const removeOrganizationTree = useCallback((uiId: number) => {
    setOrganizations((current) => removeTree(uiId, current));
  }, []);

  const updateOrganization = useCallback((uiId: number, values: EditOrganizationFormValues) => {
    setOrganizations((current) =>
      current.map((item) => {
        if (item.uiId !== uiId) {
          return item;
        }
        return {
          ...item,
          code: values.code,
          name: values.name,
          description: values.description,
          organizationTypeId: values.organizationTypeId,
          isActive: values.isActive,
          manager: values.managerName ? { ...item.manager, name: values.managerName } : undefined,
        };
      }),
    );
  }, []);

  const getOrganization = useCallback(
    (uiId: number) => findOrganization(uiId, organizations),
    [organizations],
  );

  return { organizations, addOrganizations, removeOrganizationTree, updateOrganization, getOrganization };
}
