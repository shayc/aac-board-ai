import { useEffect, useReducer, useRef } from "react";
import {
  type AvailabilityStatus,
  type BuiltInAIName,
  type CreateOptions,
  type Session,
  availability,
  createSession,
} from "./built-in-ai";

export type AIStatus =
  | "unsupported"
  | "checking"
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "creating"
  | "ready"
  | "error";

export interface UseBuiltInAIResult<K extends BuiltInAIName> {
  status: AIStatus;
  /** Download progress as a `0..1` fraction. */
  progress: number;
  /** Non-null iff `status === "ready"`. */
  session: Session<K> | null;
  /** Non-null iff `status === "error"`. */
  error: Error | null;
  /**
   * Aborts on unmount or identity change. Pass to verb calls so they cancel
   * with the hook: `session.translate(text, { signal })`.
   */
  signal: AbortSignal;
  /**
   * Starts (or retries) session creation. Call from a user gesture when
   * `status` is `"downloadable"` or `"downloading"`, or to retry after `"error"`.
   * No-op otherwise.
   */
  create: () => void;
}

interface State<K extends BuiltInAIName> {
  status: AIStatus;
  progress: number;
  session: Session<K> | null;
  error: Error | null;
  signal: AbortSignal;
}

type Action<K extends BuiltInAIName> =
  | { type: "reset"; signal: AbortSignal }
  | { type: "checked"; availability: AvailabilityStatus; force: boolean }
  | { type: "downloading"; progress: number }
  | { type: "ready"; session: Session<K> }
  | { type: "unavailable" }
  | { type: "failed"; error: Error };

function reducer<K extends BuiltInAIName>(
  state: State<K>,
  action: Action<K>,
): State<K> {
  switch (action.type) {
    case "reset":
      return {
        status: "checking",
        progress: 0,
        session: null,
        error: null,
        signal: action.signal,
      };
    case "checked":
      if (
        action.availability === "unsupported" ||
        action.availability === "unavailable"
      ) {
        return { ...state, status: action.availability };
      }
      if (
        action.availability === "downloadable" ||
        action.availability === "downloading"
      ) {
        return {
          ...state,
          status: action.force ? "downloading" : action.availability,
        };
      }
      return { ...state, status: "creating" };
    case "downloading":
      return { ...state, status: "downloading", progress: action.progress };
    case "ready":
      return {
        ...state,
        status: "ready",
        progress: 1,
        session: action.session,
      };
    case "unavailable":
      return { ...state, status: "unavailable" };
    case "failed":
      return { ...state, status: "error", error: action.error };
  }
}

function stableKey(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableKey).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableKey(v)}`);
  return `{${entries.join(",")}}`;
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function isAbort(value: unknown): boolean {
  return value instanceof DOMException && value.name === "AbortError";
}

/**
 * React binding for a built-in AI session. Owns the full lifecycle:
 * availability probe, gesture-gated create, download progress, plus abort
 * and `destroy()` on unmount or identity change.
 */
export function useBuiltInAI<K extends BuiltInAIName>(
  name: K,
  options?: CreateOptions<K>,
): UseBuiltInAIResult<K> {
  const supported = name in globalThis;
  const optionsKey = stableKey(options);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const [state, dispatch] = useReducer(
    reducer as (state: State<K>, action: Action<K>) => State<K>,
    null,
    (): State<K> => ({
      status: supported ? "checking" : "unsupported",
      progress: 0,
      session: null,
      error: null,
      signal: new AbortController().signal,
    }),
  );

  const pendingCreateRef = useRef<(() => void) | null>(null);
  const create = () => pendingCreateRef.current?.();

  useEffect(() => {
    if (!supported) return;

    const controller = new AbortController();
    const { signal } = controller;
    let session: Session<K> | null = null;

    const run = async (force: boolean): Promise<void> => {
      pendingCreateRef.current = null;
      dispatch({ type: "reset", signal });

      let status: AvailabilityStatus;
      try {
        status = await availability(name, optionsRef.current);
      } catch (error) {
        if (signal.aborted) return;
        dispatch({ type: "failed", error: toError(error) });
        pendingCreateRef.current = () => void run(true);
        return;
      }
      if (signal.aborted) return;

      dispatch({ type: "checked", availability: status, force });

      if (status === "unsupported" || status === "unavailable") return;

      if ((status === "downloadable" || status === "downloading") && !force) {
        pendingCreateRef.current = () => void run(true);
        return;
      }

      try {
        session = await createSession(name, {
          ...optionsRef.current,
          signal,
          onProgress: (progress) => {
            if (!signal.aborted) {
              dispatch({ type: "downloading", progress });
            }
          },
        });
      } catch (error) {
        if (signal.aborted || isAbort(error)) return;
        dispatch({ type: "failed", error: toError(error) });
        pendingCreateRef.current = () => void run(true);
        return;
      }
      if (signal.aborted) {
        session?.destroy();
        session = null;
        return;
      }
      if (!session) {
        dispatch({ type: "unavailable" });
        return;
      }
      dispatch({ type: "ready", session });
    };

    void run(false);

    return () => {
      controller.abort();
      session?.destroy();
      pendingCreateRef.current = null;
    };
  }, [name, optionsKey, supported]);

  return { ...state, create };
}
