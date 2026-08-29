import type { WorkflowStatus, WorkflowRequestStatus } from '../types/workflow.types';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus | WorkflowRequestStatus;
}

export function WorkflowStatusBadge({ status }: WorkflowStatusBadgeProps) {
  const palette: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    ARCHIVED: 'bg-amber-100 text-amber-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    NEEDS_REVISION: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${palette[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
