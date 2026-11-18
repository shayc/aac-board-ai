import { useState } from "react";

/**
 * Returns the value, or the last one that was not null. Content keyed off
 * "open" state can then stay on screen while its dialog animates closed.
 */
export function useLastNonNull<T>(value: T | null): T | null {
  const [lastNonNull, setLastNonNull] = useState(value);

  if (value !== null && value !== lastNonNull) {
    setLastNonNull(value);
  }

  return value ?? lastNonNull;
}
