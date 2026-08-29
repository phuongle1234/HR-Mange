import type { WorkflowRequestPermissionSet } from '../types/workflow.types';

interface WorkflowActionBarProps {
  permissions?: WorkflowRequestPermissionSet;
  onApprove?: () => void;
  onReject?: () => void;
  onFeedback?: () => void;
  onCancel?: () => void;
  onResubmit?: () => void;
}

export function WorkflowActionBar({ permissions, onApprove, onReject, onFeedback, onCancel, onResubmit }: WorkflowActionBarProps) {
  const canApprove = permissions?.canApprove ?? false;
  const canReject = permissions?.canReject ?? false;
  const canFeedback = permissions?.canFeedback ?? false;
  const canCancel = permissions?.canCancel ?? false;
  const canResubmit = permissions?.canResubmit ?? false;

  return (
    <div className="flex flex-wrap gap-2">
      {canApprove && (
        <button type="button" onClick={onApprove} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white">
          Approve
        </button>
      )}
      {canReject && (
        <button type="button" onClick={onReject} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">
          Reject
        </button>
      )}
      {canFeedback && (
        <button type="button" onClick={onFeedback} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white">
          Feedback
        </button>
      )}
      {canCancel && (
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
          Cancel
        </button>
      )}
      {canResubmit && (
        <button type="button" onClick={onResubmit} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
          Resubmit
        </button>
      )}
    </div>
  );
}
