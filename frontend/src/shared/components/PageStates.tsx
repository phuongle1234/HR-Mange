import { Button } from './Button';
import { Box, Typography } from '@mui/material';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <Box className="flex min-h-[300px] flex-col items-center justify-center gap-6">
      {/* Loader */}
      <div className="relative h-24 w-24">

        <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border border-blue-200/40" />

        <div className="absolute inset-0 animate-[spin_2s_linear_infinite]">
          <span className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40" />
          <span className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/40" />
        </div>

        <div className="absolute inset-3 animate-[spin_1.5s_linear_infinite_reverse]">
          <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/40" />
          <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-pink-400 shadow-lg shadow-pink-400/40" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl shadow-blue-500/30" />
        </div>
      </div>


      <Typography
        variant="body2"
        className="!font-semibold !tracking-wide !text-slate-500"
      >
        {label}
      </Typography>
    </Box>
  );
}

export function EmptyState({ label = 'No records found.' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-slate-500">{label}</div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm font-semibold text-danger-600">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
