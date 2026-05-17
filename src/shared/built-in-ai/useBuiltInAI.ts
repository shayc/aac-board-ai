import { useEffect, useEffectEvent, useReducer, useRef } from "react";
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
  | "gesture-required"
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
   * Aborts on unmount or identity change. Pass per call to verb operations
   * (e.g. `session.translate(text, { signal })`) so they cancel with the hook.
   *
   * Identity changes whenever the hook resets — read `result.signal` fresh
   * per call rather than capturing it across renders.
   */
  signal: AbortSignal;
  /**
   * Starts (or retries) session creation. Call from a user gesture (click,
   * keydown, pointerup, ...) when `status` is `"downloadable"`,
   * `"downloading"`, `"gesture-required"`, or `"error"`. No-op otherwise.
   *
   * The gesture is required only while the model is not yet downloaded;
   * once `status` reaches `"ready"`, verb calls proceed without one.
   */
  create: () => void;
}

interface State<K extends BuiltInAIName> {
  status: AIStatus;
  progress: number;
  session: Session<K> | null;
  error: Error | null;
  signal: AbortSignal;
  generation: number;
}

type Action<K extends BuiltInAIName> =
  | { type: "reset"; signal: AbortSignal }
  | { type: "checked"; availability: AvailabilityStatus; force: boolean }
  | { type: "downloading"; progress: number }
  | { type: "ready"; session: Session<K> }
  | { type: "unavailable" }
  | { type: "gesture-required" }
  | { type: "failed"; error: Error }
  | { type: "requested" };

function reducer<K extends BuiltInAIName>(
  state: State<K>,
  action: Action<K>,
): State<K> {
  switch (action.type) {
    case "reset":
      return {
        ...state,
        status: "checking",
        progress: 0,
        session: null,
        error: null,
        signal: action.signal,
      };
    case "checked": {
      const { availability, force } = action;
      if (availability === "unsupported" || availability === "unavailable") {
        return { ...state, status: availability };
      }
      if (availability === "downloadable" || availability === "downloading") {
        return { ...state, status: force ? "downloading" : availability };
      }
      return { ...state, status: "creating" };
    }
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
    case "gesture-required":
      return { ...state, status: "gesture-required" };
    case "failed":
      return { ...state, status: "error", error: action.error };
    case "requested":
      return { ...state, generation: state.generation + 1 };
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
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableKey(v)}`);
  return `{${entries.join(",")}}`;
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function isAbort(value: unknown): boolean {
  return value instanceof DOMException && value.name === "AbortError";
}

function isGestureRequired(value: unknown): boolean {
  return value instanceof DOMException && value.name === "NotAllowedError";
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

  const [state, dispatch] = useReducer(
    reducer as (state: State<K>, action: Action<K>) => State<K>,
    null,
    (): State<K> => ({
      status: supported ? "checking" : "unsupported",
      progress: 0,
      session: null,
      error: null,
      signal: new AbortController().signal,
      generation: 0,
    }),
  );

  const performRun = useEffectEvent(
    async (signal: AbortSignal, force: boolean): Promise<void> => {
      dispatch({ type: "reset", signal });

      let status: AvailabilityStatus;
      try {
        status = await availability(name, options);
      } catch (error) {
        if (signal.aborted) return;
        dispatch({ type: "failed", error: toError(error) });
        return;
      }
      if (signal.aborted) return;

      dispatch({ type: "checked", availability: status, force });

      if (status === "unsupported" || status === "unavailable") return;
      if ((status === "downloadable" || status === "downloading") && !force) {
        return;
      }

      let session: Session<K> | null;
      try {
        session = await createSession(name, {
          ...options,
          signal,
          onProgress: (progress) => {
            if (!signal.aborted) {
              dispatch({ type: "downloading", progress });
            }
          },
        });
      } catch (error) {
        if (signal.aborted || isAbort(error)) return;
        if (isGestureRequired(error)) {
          dispatch({ type: "gesture-required" });
          return;
        }
        dispatch({ type: "failed", error: toError(error) });
        return;
      }
      if (signal.aborted) {
        session?.destroy();
        return;
      }
      if (!session) {
        dispatch({ type: "unavailable" });
        return;
      }
      dispatch({ type: "ready", session });
    },
  );

  const destroyCurrentSession = useEffectEvent(() => {
    state.session?.destroy();
  });

  const lastGenRef = useRef(0);

  useEffect(() => {
    if (!supported) return;
    const force = state.generation > lastGenRef.current;
    lastGenRef.current = state.generation;

    const controller = new AbortController();
    void performRun(controller.signal, force);

    return () => {
      controller.abort();
      destroyCurrentSession();
    };
  }, [name, optionsKey, supported, state.generation]);

  const create = () => {
    if (
      state.status === "downloadable" ||
      state.status === "downloading" ||
      state.status === "gesture-required" ||
      state.status === "error"
    ) {
      dispatch({ type: "requested" });
    }
  };

  return { ...state, create };
}
