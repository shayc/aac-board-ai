import { useState } from "react";

/** Retains the last non-null value so closing dialogs keep their content during exit animations. */
export function useLastNonNull<T>(value: T | null): T | null {
  const [lastNonNull, setLastNonNull] = useState(value);

  if (value !== null && value !== lastNonNull) {
    setLastNonNull(value);
  }

  return value ?? lastNonNull;
}
