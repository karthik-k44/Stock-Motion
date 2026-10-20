import { useEffect, useState } from 'react';

export const useDebouncedValue = <T>(value: T, ms = 250): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
};
