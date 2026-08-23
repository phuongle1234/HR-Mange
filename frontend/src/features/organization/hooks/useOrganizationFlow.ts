import { useMemo } from 'react';
import type { Edge } from '@xyflow/react';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { buildOrganizationEdges, buildOrganizationNodes, layoutOrganizationNodes } from '../utils/organization-layout';
import type { OrganizationFlowNode } from '../utils/organization-layout';
import type { OrganizationStage } from '../types/organization.types';

const LAYOUT_DEBOUNCE_MS = 200;

export interface UseOrganizationFlowResult {
  nodes: OrganizationFlowNode[];
  edges: Edge[];
}

/**
 * organizations[] -> { nodes, edges } (task §23/§24/§25). The stage is
 * debounced 200ms before every rebuild/layout pass so rapid mutations
 * (e.g. bulk row add in the Create modal) don't thrash dagre/React Flow.
 */
export function useOrganizationFlow(organizations: OrganizationStage[]): UseOrganizationFlowResult {
  const debouncedOrganizations = useDebouncedValue(organizations, LAYOUT_DEBOUNCE_MS);

  return useMemo(() => {
    const nodes = buildOrganizationNodes(debouncedOrganizations);
    const edges = buildOrganizationEdges(debouncedOrganizations);
    return { nodes: layoutOrganizationNodes(nodes, edges), edges };
  }, [debouncedOrganizations]);
}
