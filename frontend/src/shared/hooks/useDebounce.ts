import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const debouncedSetValue = useMemo(() => debounce((nextValue: T) => setDebouncedValue(nextValue), delayMs), [delayMs]);

  useEffect(() => {
    debouncedSetValue(value);
    return () => debouncedSetValue.cancel();
  }, [value, debouncedSetValue]);

  return debouncedValue;
}
