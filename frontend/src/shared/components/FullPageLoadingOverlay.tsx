import { LoadingState } from './PageStates';

interface FullPageLoadingOverlayProps {
  isOpen: boolean;
  label?: string;
}

export function FullPageLoadingOverlay({ isOpen, label = 'Saving changes...' }: FullPageLoadingOverlayProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <LoadingState label={label} />
      </div>
    </div>
  );
}
