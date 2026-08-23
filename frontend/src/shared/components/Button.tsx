import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-lite' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-emerald-100 disabled:bg-brand-300 disabled:shadow-none',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 disabled:bg-danger-300',
  'danger-lite':
    'border border-danger-100 text-danger-600 hover:bg-danger-50 disabled:text-slate-300 disabled:border-slate-100',
  ghost: 'text-brand-700 hover:underline disabled:text-slate-400',
};

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        className,
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? 'Please wait…' : children}
    </button>
  );
}
