/**
 * Debounced Value Hook
 * Delays updating a value until after a specified time has elapsed since the last change
 */

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, ms = 250): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, ms);

    return () => clearTimeout(timeout);
  }, [value, ms]);

  return debouncedValue;
}
