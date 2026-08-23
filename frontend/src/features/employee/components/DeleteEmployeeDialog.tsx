import { ConfirmDialog, ReviewRow } from '../../../shared/components/ConfirmDialog';

interface DeleteEmployeeDialogProps {
  isOpen: boolean;
  employeeCode?: string;
  fullName?: string;
  isDeleting: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Shared delete-confirm popup reused by the list page (row action) and the detail page. */
export function DeleteEmployeeDialog({
  isOpen,
  employeeCode,
  fullName,
  isDeleting,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteEmployeeDialogProps) {
  const hasSummary = Boolean(employeeCode && fullName);

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Confirm Delete Employee"
      message="This action permanently removes the employee from the system. This cannot be undone."
      confirmLabel="Confirm delete"
      confirmVariant="danger"
      isConfirming={isDeleting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {hasSummary && (
        <>
          <ReviewRow label="Employee code" value={employeeCode} />
          <ReviewRow label="Full name" value={fullName} />
        </>
      )}
    </ConfirmDialog>
  );
}
