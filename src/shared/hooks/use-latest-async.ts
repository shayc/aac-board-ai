import { useEffect, useRef, useState } from "react";

export interface UseLatestAsyncOptions<T> {
  enabled: boolean;
  deps: readonly (string | number | boolean)[];
  run: (signal: AbortSignal) => Promise<T>;
}

export interface UseLatestAsyncReturn<T> {
  value: T | undefined;
  error: Error | undefined;
  isPending: boolean;
}

type SettledRound<T> =
  | { signature: string; status: "resolved"; value: T }
  | { signature: string; status: "rejected"; error: Error };

export function useLatestAsync<T>({
  enabled,
  deps,
  run,
}: UseLatestAsyncOptions<T>): UseLatestAsyncReturn<T> {
  const signature = deps.join("\0");

  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });

  const [round, setRound] = useState<SettledRound<T>>();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    runRef
      .current(signal)
      .then((value) => {
        if (!signal.aborted) {
          setRound({ signature, status: "resolved", value });
        }
      })
      .catch((error: unknown) => {
        if (signal.aborted) {
          return;
        }
        setRound({
          signature,
          status: "rejected",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => controller.abort();
  }, [enabled, signature]);

  const settled = enabled && round?.signature === signature ? round : undefined;

  return {
    value: settled?.status === "resolved" ? settled.value : undefined,
    error: settled?.status === "rejected" ? settled.error : undefined,
    isPending: enabled && round?.signature !== signature,
  };
}
