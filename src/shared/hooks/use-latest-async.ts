import { useEffect, useRef, useState } from "react";

export interface UseLatestAsyncOptions<T> {
  enabled: boolean;
  deps: readonly (string | number | boolean)[];
  fetch: (signal: AbortSignal) => Promise<T>;
}

export function useLatestAsync<T>({
  enabled,
  deps,
  fetch,
}: UseLatestAsyncOptions<T>): T | undefined {
  const signature = deps.join("\0");

  const fetchRef = useRef(fetch);
  useEffect(() => {
    fetchRef.current = fetch;
  });

  const [result, setResult] = useState<{ signature: string; value: T }>();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    fetchRef
      .current(signal)
      .then((value) => {
        if (!signal.aborted) {
          setResult({ signature, value });
        }
      })
      .catch((error) => {
        if (signal.aborted) {
          return;
        }
        throw error;
      });

    return () => controller.abort();
  }, [enabled, signature]);

  return enabled && result?.signature === signature ? result.value : undefined;
}
