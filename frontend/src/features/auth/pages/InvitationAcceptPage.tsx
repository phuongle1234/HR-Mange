import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { acceptInvitationSchema, type AcceptInvitationFormValues } from '../schemas/auth.schemas';
import { useAcceptInvitationMutation } from '../../invitations/hooks/useCreateInvitationsMutation';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import { normalizeApiError } from '../../../shared/api/api-error';
import { useApplyApiFieldErrors } from '../../../shared/hooks/useApiFieldErrors';

/**
 * Redeems an invitation: the visitor sets a password and the backend creates
 * their account.
 *
 * The API call happens only on submit. Accepting is a one-time, irreversible
 * state change that also requires a password, so it must never fire from
 * merely opening the link - a preview fetch or a mis-click would burn the
 * token and leave the invitee unable to finish.
 *
 * Success navigates to /login rather than logging in directly: the accept
 * response deliberately returns no access token (API-AUTH-INVITATIONS-ACCEPT).
 */
export function InvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const acceptInvitationMutation = useAcceptInvitationMutation();
  const [pageError, setPageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  const applyFieldErrors = useApplyApiFieldErrors(setError);

  async function onValid(values: AcceptInvitationFormValues) {
    setPageError(null);
    try {
      await acceptInvitationMutation.mutateAsync(values);
      toast.success('Account created successfully. You can now log in.', { position: 'top-right' });
      navigate('/login', { replace: true });
    } catch (error) {
      const apiError = normalizeApiError(error);
      // Field-level problems (password policy, mismatch) belong on the inputs;
      // token problems are not about anything the visitor just typed, so they
      // read as a page-level message instead.
      const handledAsFieldError = applyFieldErrors(apiError);
      if (!handledAsFieldError) {
        setPageError(resolveTokenErrorMessage(apiError.code));
      }
    }
  }

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

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4 bg-white p-2">
      <div>
        <h2 className="text-xl font-black text-slate-900">Create your account</h2>
        <p className="mt-1 text-sm text-slate-500">Choose a password to finish accepting your invitation.</p>
      </div>

      <input type="hidden" {...register('token')} />

      <TextField label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <TextField label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

      {pageError && <p role="alert" className="text-sm font-semibold text-danger-600">{pageError}</p>}

      <Button type="submit" className="w-full" isLoading={isSubmitting || acceptInvitationMutation.isPending} disabled={isSubmitting || acceptInvitationMutation.isPending}>
        Create account
      </Button>

      <Button type="button" variant="secondary" className="w-full" onClick={() => navigate('/login')}>
        Back to login
      </Button>
    </form>
  );
}

/**
 * Token failures are deliberately vague about whether a token ever existed,
 * matching the backend's generic INVITATION_TOKEN_INVALID.
 */
function resolveTokenErrorMessage(code: string): string {
  switch (code) {
    case 'INVITATION_EXPIRED':
      return 'This invitation has expired. Please ask an administrator to send a new one.';
    case 'INVITATION_ALREADY_ACCEPTED':
    case 'USER_ALREADY_EXISTS':
      return 'This invitation has already been used. Try logging in instead.';
    case 'INVITATION_TOKEN_INVALID':
      return 'This invitation link is invalid.';
    default:
      return 'This invitation could not be accepted. Please try again.';
  }
}
