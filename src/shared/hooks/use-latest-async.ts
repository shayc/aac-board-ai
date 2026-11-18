import { useEffect, useEffectEvent, useState } from "react";

interface UseLatestAsyncOptions<Value> {
  deps: readonly (string | number | boolean | undefined)[];
  run: ((signal: AbortSignal) => Promise<Value>) | undefined;
}

export interface UseLatestAsyncReturn<Value> {
  value: Value | undefined;
  error: Error | undefined;
  isPending: boolean;
}

type SettledResult<Value> =
  | { dependencyKey: string; status: "resolved"; value: Value }
  | { dependencyKey: string; status: "rejected"; error: Error };

export function useLatestAsync<Value>({
  deps,
  run,
}: UseLatestAsyncOptions<Value>): UseLatestAsyncReturn<Value> {
  const isEnabled = run !== undefined;
  const dependencyKey = JSON.stringify(deps);
  const runLatest = useEffectEvent((signal: AbortSignal) => run?.(signal));

  const [result, setResult] = useState<SettledResult<Value>>();

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const request = runLatest(signal);
    if (!request) {
      return;
    }

    request
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
  }, [isEnabled, dependencyKey]);

  const currentResult =
    isEnabled && result?.dependencyKey === dependencyKey ? result : undefined;

  return {
    value:
      currentResult?.status === "resolved" ? currentResult.value : undefined,
    error:
      currentResult?.status === "rejected" ? currentResult.error : undefined,
    isPending: isEnabled && !currentResult,
  };
}
