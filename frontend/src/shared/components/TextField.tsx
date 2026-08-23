import type { InputHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, id, className, ...rest }: TextFieldProps) {
  const fieldId = id ?? rest.name;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-bold text-slate-700">
        {label}
      </label>
      <input
        id={fieldId}
        className={cn(
          'h-11 w-full rounded-lg border px-3 text-sm outline-none transition-colors',
          'focus:border-brand-500 focus:ring-4 focus:ring-brand-100',
          error ? 'border-danger-400 ring-danger-100' : 'border-slate-200',
          className,
        )}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={errorId}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-semibold text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
