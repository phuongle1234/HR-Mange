import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/auth.schemas';
import { useForgotPasswordMutation } from '../hooks/useForgotPasswordMutation';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import { applyFieldErrors } from '../../../shared/utils/api-error-mapping';
import type { FrontendApiError } from '../../../shared/api/api-error';

const SAFE_ACCEPTED_MESSAGE =
  'If the email is registered, password reset instructions will be sent.';

export function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [isAccepted, setIsAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '' },
  });

  async function onValid(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      await forgotPasswordMutation.mutateAsync(values);
      setIsAccepted(true);
    } catch (err) {
      const error = err as FrontendApiError;

      if (error.code === 'VALIDATION_ERROR' && applyFieldErrors(error, setError)) {
        return;
      }

      if (error.code === 'TOO_MANY_REQUESTS') {
        setFormError('Too many attempts. Please wait a moment and try again.');
        return;
      }

      // Network/unexpected errors still show the safe accepted message —
      // the UI outcome must never differ based on whether the email exists.
      setIsAccepted(true);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-slate-950">Forgot password</h2>
      <p className="mt-1 text-sm text-slate-500">{SAFE_ACCEPTED_MESSAGE}</p>

      {isAccepted ? (
        <p
          role="status"
          className="mt-6 rounded-lg bg-brand-50 p-4 text-sm font-semibold text-brand-700"
        >
          {SAFE_ACCEPTED_MESSAGE}
        </p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onValid)} noValidate>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting || forgotPasswordMutation.isPending}
          >
            Send instructions
          </Button>
          {formError && (
            <p role="alert" className="text-center text-sm font-semibold text-danger-600">
              {formError}
            </p>
          )}
        </form>
      )}

      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm font-bold text-brand-700 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
