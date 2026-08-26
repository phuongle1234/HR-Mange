import type { ChangeEvent, ReactNode } from 'react';
import { Button } from './Button';

export const SEARCH_FILTER_LIMIT_OPTIONS = [10, 20, 50, 100] as const;

export interface SearchFilterOption {
  value: string;
  label: string;
}

interface SearchAndFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  createLabel?: string;
  onCreate?: () => void;
  limitValue?: number;
  onLimitChange?: (value: number) => void;
  children?: ReactNode;
}

export function SearchAndFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  createLabel = 'Create',
  onCreate,
  limitValue,
  onLimitChange,
  children,
}: SearchAndFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          aria-label="Search records"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 md:max-w-[360px]"
        />

        {children && <div className="w-full md:max-w-[220px]">{children}</div>}
      </div>
      <div className="flex gap-3">
      {onCreate && (
        <Button onClick={onCreate} className="whitespace-nowrap">
          {createLabel}
        </Button>
      )}

        {onLimitChange && (
          <label className="flex w-full items-center gap-2 text-sm font-semibold text-slate-600 md:w-auto">
            <select aria-label="Rows per page" value={limitValue ?? SEARCH_FILTER_LIMIT_OPTIONS[0]} onChange={(event: ChangeEvent<HTMLSelectElement>) => onLimitChange(Number(event.target.value))} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
              {SEARCH_FILTER_LIMIT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
