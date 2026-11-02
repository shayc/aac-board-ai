import { useEffect, useEffectEvent, useState } from "react";

interface UseLatestAsyncOptions<T> {
  enabled: boolean;
  deps: readonly (string | number | boolean)[];
  run: (signal: AbortSignal) => Promise<T>;
}

interface UseLatestAsyncReturn<T> {
  value: T | undefined;
  error: Error | undefined;
  isPending: boolean;
}

type SettledResult<T> =
  | { dependencyKey: string; status: "resolved"; value: T }
  | { dependencyKey: string; status: "rejected"; error: Error };

export function useLatestAsync<T>({
  enabled,
  deps,
  run,
}: UseLatestAsyncOptions<T>): UseLatestAsyncReturn<T> {
  const dependencyKey = JSON.stringify(deps);
  const runLatest = useEffectEvent(run);

  const [result, setResult] = useState<SettledResult<T>>();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    runLatest(signal)
      .then((value) => {
        if (!signal.aborted) {
          setResult({ dependencyKey, status: "resolved", value });
        }
      })
      .catch((error: unknown) => {
        if (signal.aborted) {
          return;
        }

        setResult({
          dependencyKey,
          status: "rejected",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => controller.abort();
  }, [enabled, dependencyKey]);

  const currentResult =
    enabled && result?.dependencyKey === dependencyKey ? result : undefined;

  return {
    value:
      currentResult?.status === "resolved" ? currentResult.value : undefined,
    error:
      currentResult?.status === "rejected" ? currentResult.error : undefined,
    isPending: enabled && result?.dependencyKey !== dependencyKey,
  };
}
