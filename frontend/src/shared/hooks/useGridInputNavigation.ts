import type { KeyboardEvent } from 'react';

interface GridInputNavigationOptions {
  gridName: string;
}

export function useGridInputNavigation({ gridName }: GridInputNavigationOptions) {
  function focusCell(rowIndex: number, columnIndex: number) {
    const selector = `[data-grid-name="${gridName}"][data-grid-row="${rowIndex}"][data-grid-column="${columnIndex}"]`;
    const next = document.querySelector<HTMLElement>(selector);
    next?.focus();
  }

  function getGridInputProps(rowIndex: number, columnIndex: number) {
    return {
      'data-grid-name': gridName,
      'data-grid-row': rowIndex,
      'data-grid-column': columnIndex,
      onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const nextByKey: Record<string, [number, number]> = {
          ArrowDown: [rowIndex + 1, columnIndex],
          ArrowUp: [rowIndex - 1, columnIndex],
          ArrowRight: [rowIndex, columnIndex + 1],
          ArrowLeft: [rowIndex, columnIndex - 1],
        };
        const next = nextByKey[event.key];
        if (!next) {
          return;
        }
        event.preventDefault();
        focusCell(next[0], next[1]);
      },
    };
  }

  return { getGridInputProps };
}
