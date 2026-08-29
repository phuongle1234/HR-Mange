import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowFlowNode } from '../utils/workflow-flow-layout';

export function WorkflowStepNode({ data }: NodeProps<WorkflowFlowNode>) {
  return (
    <div className="w-[220px] rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-brand-500 !bg-white" />
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">Workflow step</div>
      <div className="mt-1 text-sm font-black text-slate-900">{data.step.name}</div>
      <div className="mt-1 text-xs text-slate-500">{data.organizationTypeName}</div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-brand-500 !bg-white" />
    </div>
  );
}
