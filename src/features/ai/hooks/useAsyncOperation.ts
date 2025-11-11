import { useCallback, useRef, useState } from "react";

export type AsyncStatus = "idle" | "running" | "success" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
}

export interface AsyncOperationResult<T, TArgs extends unknown[]> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
  run: (...args: TArgs) => Promise<void>;
  cancel: () => void;
}

/**
 * Manages async operation state with cancellation support
 *
 * - Tracks status: idle → running → success/error
 * - Exposes run() and cancel() methods
 * - Automatically aborts in-flight operations when new run starts
 * - Uses AbortController for cancellation
 */
export function useAsyncOperation<T, TArgs extends unknown[]>(
  fn: (signal: AbortSignal, ...args: TArgs) => Promise<T>,
): AsyncOperationResult<T, TArgs> {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      // Cancel any in-flight operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this run
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState({
        status: "running",
        data: null,
        error: null,
      });

      try {
        const result = await fn(controller.signal, ...args);

        // Check if this operation was cancelled
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "success",
          data: result,
          error: null,
        });
      } catch (error) {
        // Check if this was an abort
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    },
    [fn],
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      setState({
        status: "idle",
        data: null,
        error: null,
      });
    }
  }, []);

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    run,
    cancel,
  };
}
