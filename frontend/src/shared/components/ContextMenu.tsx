import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

export interface ContextMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: (props: { onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void }) => React.ReactNode;
}

export function ContextMenu({ items, children }: ContextMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!position) {
      return;
    }

    function close() {
      setPosition(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [position]);

  function handleContextMenu(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
  }

  return (
    <>
      {children({ onContextMenu: handleContextMenu })}
      {position && (
        <div role="menu" className="fixed z-50 min-w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-soft" style={{ left: position.x, top: position.y }} onMouseDown={(event) => event.stopPropagation()}>
          {items.map((item) => (
            <button key={item.key} type="button" role="menuitem" disabled={item.disabled} className={cn('block w-full px-4 py-2 text-left text-sm font-bold disabled:cursor-not-allowed disabled:text-slate-300', item.danger ? 'text-danger-600 hover:bg-danger-50' : 'text-slate-700 hover:bg-brand-50')} onClick={() => { if (item.disabled) return; setPosition(null); item.onSelect(); }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
