import { type Dispatch, type SetStateAction, useState, useEffect } from "react";

export type UsePersistentStateReturn<T> = readonly [
  T,
  Dispatch<SetStateAction<T>>,
];

export function usePersistentState<T>(
  key: string,
  initial: T,
): UsePersistentStateReturn<T> {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initial;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
