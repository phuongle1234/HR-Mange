import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

type GridBreakpoint = 'sm' | 'md' | 'lg' | 'xl';
type GridColumnSpan = 1 | 2 | 3 | 4 | 5 | 6;
type GridCols = number | Partial<Record<GridBreakpoint, number>>;

const GRID_COLUMNS: Record<GridBreakpoint, string> = {
  sm: 'sm:grid-cols',
  md: 'md:grid-cols',
  lg: 'lg:grid-cols',
  xl: 'xl:grid-cols',
};

const COLUMN_SPANS: Record<GridColumnSpan, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
};

function resolveGridClass(cols: GridCols): string {
  if (typeof cols === 'number') {
    return `grid-cols-${cols}`;
  }

  return Object.entries(cols)
    .map(([breakpoint, value]) => `${GRID_COLUMNS[breakpoint as GridBreakpoint]}-${value}`)
    .join(' ');
}

function resolveColSpanClass(span: GridColumnSpan): string {
  return COLUMN_SPANS[span] ?? 'col-span-1';
}

export function ResponsiveGrid({
  cols = 1,
  className,
  children,
}: {
  cols?: GridCols;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('grid gap-3', resolveGridClass(cols), className)}>{children}</div>;
}

export function GridColumn({
  span = 1,
  className,
  children,
}: {
  span?: GridColumnSpan;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(resolveColSpanClass(span), className)}>{children}</div>;
}
