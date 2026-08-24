import type { ChangeEvent, ReactNode } from 'react';
import { Button } from './Button';

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
  children?: ReactNode;
}

export function SearchAndFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  createLabel = 'Create',
  onCreate,
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

      {onCreate && (
        <Button onClick={onCreate} className="whitespace-nowrap">
          {createLabel}
        </Button>
      )}
    </div>
  );
}
