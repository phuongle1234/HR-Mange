import type { WorkflowHistory } from '../types/workflow.types';

interface WorkflowHistoryTimelineProps {
  history: WorkflowHistory[];
}

export function WorkflowHistoryTimeline({ history }: WorkflowHistoryTimelineProps) {
  return (
    <div className="space-y-4">
      {history.length === 0 && <p className="text-sm text-slate-500">No history yet.</p>}
      {history.map((entry) => (
        <div key={entry.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-black text-brand-700">{entry.action.slice(0, 2)}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-900">{entry.employeeName ?? 'Actor'}</p>
              <span className="text-xs uppercase tracking-wide text-slate-500">{entry.action}</span>
            </div>
            {entry.comment && <p className="mt-1 text-sm text-slate-600">{entry.comment}</p>}
            <p className="mt-1 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
