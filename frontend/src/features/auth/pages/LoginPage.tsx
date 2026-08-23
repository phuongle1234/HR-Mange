import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schemas';
import { useLoginMutation } from '../hooks/useLoginMutation';
import { mapLoginError } from '../utils/map-auth-error';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import type { FrontendApiError } from '../../../shared/api/api-error';

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  async function onValid(values: LoginFormValues) {
    setFormError(null);
    try {
      await loginMutation.mutateAsync(values);
      navigate('/employees', { replace: true });
    } catch (error) {
      setFormError(mapLoginError(error as FrontendApiError));
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-slate-950">Welcome back</h2>
      <p className="mt-1 text-sm text-slate-500">
        Sign in to manage employees and profile security.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onValid)} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-bold text-slate-700">
              Password
            </label>
            <button
              type="button"
              className="text-xs font-bold text-brand-700"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password) || undefined}
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            {...register('password')}
          />
          {errors.password && (
            <p role="alert" className="text-xs font-semibold text-danger-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting || loginMutation.isPending}
        >
          Login
        </Button>

        {formError && (
          <p role="alert" className="text-center text-sm font-semibold text-danger-600">
            {formError}
          </p>
        )}
      </form>

      <div className="mt-4 text-center">
        <Link to="/forgot-password" className="text-sm font-bold text-brand-700 hover:underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
