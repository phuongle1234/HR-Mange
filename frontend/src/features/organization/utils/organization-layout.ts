import dagre from '@dagrejs/dagre';
import { Position } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import type { OrganizationStage } from '../types/organization.types';

export interface OrganizationNodeData extends Record<string, unknown> {
  organization: OrganizationStage;
}

export type OrganizationFlowNode = Node<OrganizationNodeData, 'organization'>;

const NODE_WIDTH = 220;
const NODE_HEIGHT = 92;

/** Task §23 - one React Flow node per stage entry, id `organization-${uiId}`, never the DB id. */
export function buildOrganizationNodes(organizations: OrganizationStage[]): OrganizationFlowNode[] {
  return organizations.map((organization) => ({
    id: `organization-${organization.uiId}`,
    type: 'organization',
    position: { x: 0, y: 0 },
    data: { organization },
  }));
}

/** Task §24 - one edge per parent/child relationship, derived from `parentUiId`. */
export function buildOrganizationEdges(organizations: OrganizationStage[]): Edge[] {
  return organizations
    .filter((organization): organization is OrganizationStage & { parentUiId: number } => organization.parentUiId !== null)
    .map((organization) => ({
      id: `edge-${organization.parentUiId}-${organization.uiId}`,
      source: `organization-${organization.parentUiId}`,
      target: `organization-${organization.uiId}`,
      type: 'smoothstep',
    }));
}

/** Task §25 - automatic top-to-bottom layout via dagre; parent above, children below. */
export function layoutOrganizationNodes(
  nodes: OrganizationFlowNode[],
  edges: Edge[],
): OrganizationFlowNode[] {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'TB', nodesep: 48, ranksep: 80 });

  nodes.forEach((node) => graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));

  dagre.layout(graph);

  return nodes.map((node) => {
    const { x, y } = graph.node(node.id);
    return {
      ...node,
      // dagre reports the node's center; React Flow positions by top-left corner.
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });
}
