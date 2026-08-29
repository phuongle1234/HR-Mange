import { useEffect, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: (event: PointerEvent) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && ref.current && !ref.current.contains(target)) {
        onOutside(event);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [enabled, onOutside, ref]);
}
