import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { ErrorState, LoadingState } from '../../../shared/components/PageStates';
import { useAcceptInvitationMutation } from '../../invitations/hooks/useCreateInvitationsMutation';

export function InvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const acceptInvitationMutation = useAcceptInvitationMutation();

  useEffect(() => {
    if (!token) {
      return;
    }
    acceptInvitationMutation.mutate({ token });
  }, [acceptInvitationMutation, token]);

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-black text-slate-900">Invitation link is missing a token.</p>
        <p className="mt-2 text-sm text-slate-500">Open the invitation using the link sent in your email.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/login')}>
          Back to login
        </Button>
      </div>
    );
  }

  if (acceptInvitationMutation.isPending) {
    return <LoadingState label="Accepting invitation..." />;
  }

  if (acceptInvitationMutation.isSuccess) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-black text-slate-900">Invitation accepted.</p>
        <p className="mt-2 text-sm text-slate-500">Your account is ready to sign in.</p>
        <Button className="mt-4" onClick={() => navigate('/login')}>
          Continue to login
        </Button>
      </div>
    );
  }

  if (acceptInvitationMutation.isError) {
    return (
      <ErrorState
        message="This invitation could not be accepted. The link may be expired or invalid."
        onRetry={() => acceptInvitationMutation.mutate({ token })}
      />
    );
  }

  return <LoadingState label="Preparing invitation..." />;
}
