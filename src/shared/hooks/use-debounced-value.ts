import { useEffect, useState } from "react";

export function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
