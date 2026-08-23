import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { changePasswordSchema, type ChangePasswordFormValues } from '../schemas/auth.schemas';
import { useChangePasswordMutation } from '../hooks/useChangePasswordMutation';
import { mapChangePasswordError } from '../utils/map-auth-error';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import type { FrontendApiError } from '../../../shared/api/api-error';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePasswordMutation = useChangePasswordMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  async function onValid(values: ChangePasswordFormValues) {
    setFormError(null);
    try {
      await changePasswordMutation.mutateAsync(values);
      toast.success('Password changed successfully.', { position: 'top-right' });
      reset();
    } catch (err) {
      const message = mapChangePasswordError(err as FrontendApiError, setError);
      if (message) {
        setFormError(message);
      }
    }
  }

  function handleCancel() {
    navigate('/employees');
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-2xl font-black text-slate-950">Change Password</h2>
      <p className="mt-1 text-sm text-slate-500">
        Update your password to keep your workspace secure.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onValid)} noValidate>
        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmNewPassword?.message}
          {...register('confirmNewPassword')}
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting || changePasswordMutation.isPending}
        >
          Change Password
        </Button>

        {formError && (
          <p role="alert" className="text-center text-sm font-semibold text-danger-600">
            {formError}
          </p>
        )}
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          className="text-sm font-bold text-brand-700 hover:underline"
          onClick={handleCancel}
        >
          Back to employees
        </button>
      </div>
    </div>
  );
}
