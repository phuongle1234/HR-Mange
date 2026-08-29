import dagre from '@dagrejs/dagre';
import { Position, type Edge, type Node } from '@xyflow/react';
import type { WorkflowStep } from '../types/workflow.types';

export interface WorkflowFlowNodeData extends Record<string, unknown> {
  step: WorkflowStep;
  organizationTypeName?: string;
}

export type WorkflowFlowNode = Node<WorkflowFlowNodeData, 'workflowStep'>;

const NODE_WIDTH = 230;
const NODE_HEIGHT = 94;

export function buildWorkflowStepNodes(steps: WorkflowStep[]): WorkflowFlowNode[] {
  return steps.map((step) => ({
    id: `step-${step.id}`,
    type: 'workflowStep',
    data: {
      step,
      organizationTypeName: step.organizationTypeName ?? 'Workflow step',
    },
    position: { x: 0, y: 0 },
  }));
}

export function buildWorkflowStepEdges(steps: WorkflowStep[]): Edge[] {
  return steps
    .filter((step) => step.parentId)
    .map((step) => ({
      id: `edge-${step.parentId}-${step.id}`,
      source: `step-${step.parentId}`,
      target: `step-${step.id}`,
      type: 'smoothstep',
    }));
}

export function layoutWorkflowStepNodes(nodes: WorkflowFlowNode[], edges: Edge[]): WorkflowFlowNode[] {
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
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });
}
