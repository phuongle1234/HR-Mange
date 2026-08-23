import { Background, ReactFlow } from '@xyflow/react';
import type { Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { OrganizationActionsContext } from './organization-actions.context';
import type { OrganizationActions } from './organization-actions.context';
import { OrganizationNode } from './OrganizationNode';
import type { OrganizationFlowNode } from '../utils/organization-layout';

const NODE_TYPES = { organization: OrganizationNode };

interface OrganizationFlowProps {
  nodes: OrganizationFlowNode[];
  edges: Edge[];
  actions: OrganizationActions;
}

/**
 * Read-only tree canvas - task §9: no drag/connect/pan/zoom, no `fitView`
 * (layout is computed once by dagre, not by the user). Nodes/edges are
 * passed straight through as controlled props (not `useNodesState`) since
 * they are never draggable, so there is no interactive position state to
 * own here.
 */

export function OrganizationFlow({ nodes, edges, actions }: OrganizationFlowProps) {
  return (
    <div className="h-[calc(100vh-260px)] min-h-[420px] rounded-2xl border border-slate-200 bg-slate-50">
      <OrganizationActionsContext.Provider value={actions}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          nodesConnectable={false}
          panOnScroll={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
        </ReactFlow>
      </OrganizationActionsContext.Provider>
    </div>
  );
}
