import '@xyflow/react/dist/style.css';
import { ReactFlow, Background, type Edge, type Node } from '@xyflow/react';
import { useMemo } from 'react';
import { buildWorkflowStepEdges, buildWorkflowStepNodes, layoutWorkflowStepNodes } from '../utils/workflow-flow-layout';
import type { WorkflowStep } from '../types/workflow.types';
import { WorkflowStepNode } from './WorkflowStepNode';

const nodeTypes = {
  workflowStep: WorkflowStepNode,
};

interface WorkflowFlowProps {
  steps: WorkflowStep[];
}

export function WorkflowFlow({ steps }: WorkflowFlowProps) {
  const nodes = useMemo(() => {
    const builtNodes = buildWorkflowStepNodes(steps);
    const edges = buildWorkflowStepEdges(steps);
    return layoutWorkflowStepNodes(builtNodes, edges);
  }, [steps]);

  const edges = useMemo<Edge[]>(() => buildWorkflowStepEdges(steps), [steps]);

  return (
    <div className="h-[420px] w-full rounded-2xl border border-slate-200 bg-slate-50">
      <ReactFlow
        nodes={nodes as Node[]}
        edges={edges}
        fitView
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background gap={18} size={1} />
      </ReactFlow>
    </div>
  );
}
