import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { Button, type ButtonVariant } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  isConfirming?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmDialogPanelProps extends Omit<ConfirmDialogProps, 'isOpen'> {}

function ConfirmDialogPanel({
  title,
  message,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isConfirming = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable nodeRef={panelRef} handle=".confirm-dialog-drag-handle" cancel="button,input,select,textarea,[data-no-drag='true']">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-soft">
        <div className="confirm-dialog-drag-handle cursor-move select-none">
          <h2 id="confirm-dialog-title" className="text-xl font-black text-slate-950">
            {title}
          </h2>

          {message && (
            <p className="mt-1 text-sm text-slate-500">
              {message}
            </p>
          )}
        </div>

        {children && (
          <div className="mt-4 rounded-xl border border-slate-200" data-no-drag="true">
            {children}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row" data-no-drag="true">
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>

          <Button variant={confirmVariant} onClick={onConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-3 text-sm font-semibold text-danger-600">
            {errorMessage}
          </p>
        )}
      </div>
    </Draggable>
  );
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isConfirming = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (isConfirming) return;

      const target = event.target as Node;

      if (
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        onCancel();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, isConfirming, onCancel]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isConfirming) {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isConfirming, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
      <div ref={panelRef} className="w-full max-w-xl">
        <ConfirmDialogPanel title={title} message={message} confirmLabel={confirmLabel} cancelLabel={cancelLabel} confirmVariant={confirmVariant} isConfirming={isConfirming} errorMessage={errorMessage} onConfirm={onConfirm} onCancel={onCancel}>
          {children}
        </ConfirmDialogPanel>
      </div>
    </div>
  );
}

interface ReviewRowProps {
  label: string;
  value: ReactNode;
}

export function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
      <span className="font-bold text-slate-500">{label}</span>
      <strong className="text-slate-950">{value}</strong>
    </div>
  );
}
