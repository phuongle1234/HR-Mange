import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

interface SortableTableHeaderProps<TSortField extends string> {
  field: TSortField;
  label: string;
  activeField: TSortField;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: TSortField) => void;
  className?: string;
}

export function SortableTableHeader<TSortField extends string>({ field, label, activeField, sortOrder, onSortChange, className = '' }: SortableTableHeaderProps<TSortField>) {
  const isActive = activeField === field;

  return (
    <div aria-label={`Sort by ${label}`} aria-sort={isActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'} onClick={() => onSortChange(field)} className={`inline-flex min-h-8 items-center gap-1 text-xs font-black uppercase text-slate-500 transition hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-200 ${className}`}>
      <span>{label}</span>
      <span className="flex h-5 w-4 flex-col items-center justify-center leading-none">
        <ArrowDropUpIcon fontSize="small" className={isActive && sortOrder === 'asc' ? 'text-brand-600' : 'text-slate-300'} />
        <ArrowDropDownIcon fontSize="small" className={`-mt-3 ${isActive && sortOrder === 'desc' ? 'text-brand-600' : 'text-slate-300'}`} />
      </span>
    </div>
  );
}
