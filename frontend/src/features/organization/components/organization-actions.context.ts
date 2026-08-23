import { createContext, useContext } from 'react';

export interface OrganizationActions {
  onAddChild: (uiId: number) => void;
  onDelete: (uiId: number) => void;
  onOpenEdit: (uiId: number) => void;
}

/**
 * Lets OrganizationNode fire node-level actions without threading callbacks
 * through organization-layout.ts's pure `data.organization` - keeps tree
 * building free of UI concerns (task §35: "Tách tree logic khỏi UI").
 */
export const OrganizationActionsContext = createContext<OrganizationActions | null>(null);

export function useOrganizationActions(): OrganizationActions {
  const context = useContext(OrganizationActionsContext);
  if (!context) {
    throw new Error('useOrganizationActions must be used within OrganizationActionsContext.Provider');
  }
  return context;
}
