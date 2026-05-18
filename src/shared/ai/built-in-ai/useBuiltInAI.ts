import { useEffect, useEffectEvent, useReducer, useRef } from "react";
import {
  type AvailabilityStatus,
  type BuiltInAIName,
  type CreateOptions,
  type Session,
  availability,
  createSession,
  isSupported,
} from "./namespaces";

/**
 * Mirrors the spec `Availability` (`"unavailable"`, `"downloadable"`,
 * `"downloading"`, `"available"` → `"ready"`) and adds hook-local states:
 * `"unsupported"`, `"checking"`, `"gesture-required"`, `"creating"`, `"error"`.
 */
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

interface UseBuiltInAIResultBase {
  /** Download progress as a `0..1` fraction. */
  progress: number;
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

/**
 * Discriminated by `status`: narrowing on `"ready"` yields a non-null
 * `session`; narrowing on `"error"` yields a non-null `error`. Every other
 * status guarantees both are `null`.
 */
export type UseBuiltInAIResult<K extends BuiltInAIName> =
  | (UseBuiltInAIResultBase & {
      status: "ready";
      session: Session<K>;
      error: null;
    })
  | (UseBuiltInAIResultBase & {
      status: "error";
      session: null;
      error: Error;
    })
  | (UseBuiltInAIResultBase & {
      status: Exclude<AIStatus, "ready" | "error">;
      session: null;
      error: null;
    });

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
  | { type: "retry" };

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
    case "retry":
      return { ...state, generation: state.generation + 1 };
  }
}

function serializeOptions(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(serializeOptions).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${JSON.stringify(k)}:${serializeOptions(v)}`);
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

function toResult<K extends BuiltInAIName>(
  state: State<K>,
  create: () => void,
): UseBuiltInAIResult<K> {
  const { status, progress, signal, session, error } = state;
  const base = { progress, signal, create };
  switch (status) {
    case "ready":
      return { ...base, status, session: session as Session<K>, error: null };
    case "error":
      return { ...base, status, session: null, error: error! };
    default:
      return { ...base, status, session: null, error: null };
  }
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
  const supported = isSupported(name);
  const optionsKey = serializeOptions(options);

  const [state, dispatch] = useReducer(
    reducer as (state: State<K>, action: Action<K>) => State<K>,
    null,
    (): State<K> => ({
      status: supported ? "checking" : "unsupported",
      progress: 0,
      session: null,
      error: null,
      signal: AbortSignal.abort(),
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
    // A bumped generation means create() was called — treat the rerun as a
    // user-requested retry (force=true), which skips the downloadable/
    // downloading wait and proceeds straight to namespace.create().
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
      dispatch({ type: "retry" });
    }
  };

  return toResult(state, create);
}
