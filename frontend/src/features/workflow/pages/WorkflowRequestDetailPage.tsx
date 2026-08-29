import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FrontendApiError } from '../../../shared/api/api-error';
import { HttpStatus } from '../../../shared/api/http-status';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { useWorkflowRequestDetailQuery } from '../hooks/useWorkflowRequestDetailQuery';
import { WorkflowActionBar } from '../components/WorkflowActionBar';
import { WorkflowHistoryTimeline } from '../components/WorkflowHistoryTimeline';
import { WorkflowStatusBadge } from '../components/WorkflowStatusBadge';
import { useWorkflowActionMutation } from '../hooks/useWorkflowActionMutation';
import type { WorkflowRequestActionPayload } from '../types/workflow.types';

type DetailAction = WorkflowRequestActionPayload['action'];

const COMMENT_REQUIRED_ACTIONS: DetailAction[] = ['feedback', 'reject'];

export function WorkflowRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const requestQuery = useWorkflowRequestDetailQuery(id ?? '');
  const actionMutation = useWorkflowActionMutation();
  const [pendingAction, setPendingAction] = useState<DetailAction | null>(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const request = requestQuery.data;
  const history = useMemo(() => request?.history ?? [], [request]);

  if (requestQuery.isLoading) {
    return <p>Loading request...</p>;
  }

  if (!request) {
    return <p>Request not found.</p>;
  }

  function openAction(action: DetailAction) {
    setPendingAction(action);
    setComment('');
    setCommentError(null);
  }

  function closeActionDialog() {
    if (actionMutation.isPending) return;

    setPendingAction(null);
    setComment('');
    setCommentError(null);
  }

  async function runAction() {
    const currentRequest = request;
    if (!pendingAction || !currentRequest) return;

    if (COMMENT_REQUIRED_ACTIONS.includes(pendingAction) && comment.trim().length === 0) {
      setCommentError('Comment is required for this action.');
      return;
    }

    const payload: WorkflowRequestActionPayload = {
      action: pendingAction,
      revision: currentRequest.revision,
      comment: comment.trim() || undefined,
      ...(pendingAction === 'resubmit' ? { formData: currentRequest.formData } : {}),
    };

    try {
      await actionMutation.mutateAsync({ id: currentRequest.id, payload });
      navigate('/workflow-requests');
    } catch (error) {
      if (error instanceof FrontendApiError && error.status === HttpStatus.CONFLICT && error.code === 'WORKFLOW_REQUEST_STALE') {
        await requestQuery.refetch();
        toast.info('This request changed. The latest state has been loaded.', { position: 'top-right' });
        closeActionDialog();
      }
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Workflow request</p>
          <h2 className="text-2xl font-black text-slate-900">{request.workflow?.name ?? 'Request'}</h2>
        </div>
        <WorkflowStatusBadge status={request.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Form data</h3>
          <dl className="space-y-3">
            {Object.entries(request.formData).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3 border-b border-slate-200 pb-2">
                <dt className="font-bold text-slate-600">{key}</dt>
                <dd className="text-right text-slate-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Actions</h3>
          <WorkflowActionBar permissions={request.permissions} onApprove={() => openAction('approve')} onReject={() => openAction('reject')} onFeedback={() => openAction('feedback')} onCancel={() => openAction('cancel')} onResubmit={() => openAction('resubmit')} />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">History</h3>
        <WorkflowHistoryTimeline history={history} />
      </section>

      <ConfirmDialog isOpen={Boolean(pendingAction)} title="Confirm workflow action" message="Send this workflow action?" confirmLabel="Confirm" isConfirming={actionMutation.isPending} errorMessage={commentError} onConfirm={runAction} onCancel={closeActionDialog}>
        <label className="block p-4 text-sm font-medium text-slate-700">
          Comment
          <textarea value={comment} onChange={(event) => { setComment(event.target.value); setCommentError(null); }} className="mt-1 h-24 w-full rounded-lg border border-slate-200 p-3" placeholder={pendingAction && COMMENT_REQUIRED_ACTIONS.includes(pendingAction) ? 'Required comment' : 'Optional comment'} />
        </label>
      </ConfirmDialog>
    </div>
  );
}
