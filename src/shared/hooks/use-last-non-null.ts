import { useState } from "react";

/** Keeps content keyed off "open" state on screen while its dialog closes. */
export function useLastNonNull<T>(value: T | null): T | null {
  const [lastNonNull, setLastNonNull] = useState(value);

  if (value !== null && value !== lastNonNull) {
    setLastNonNull(value);
  }

  return value ?? lastNonNull;
}
