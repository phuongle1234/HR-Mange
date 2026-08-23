import { EMPLOYEE_STATUS_LABELS, type EmployeeStatus } from '../types/employee.types';
import { cn } from '../../../shared/utils/cn';

/**
 * No approved visual precedent exists for the 4-value status enum (the HTML
 * previews only ever show placeholder "Active"/"Draft" pills). This mapping
 * is an implementation default: ACTIVE=brand green, ON_LEAVE=warning amber,
 * INACTIVE=neutral slate, TERMINATED=danger red.
 */
const STATUS_CLASSES: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-brand-50 text-brand-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  ON_LEAVE: 'bg-warning-50 text-warning-700',
  TERMINATED: 'bg-danger-50 text-danger-700',
};

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-black',
        STATUS_CLASSES[status],
      )}
    >
      {EMPLOYEE_STATUS_LABELS[status]}
    </span>
  );
}
