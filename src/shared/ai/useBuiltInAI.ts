import { useEffect, useEffectEvent, useReducer } from "react";
import { useDownloadProgress } from "./downloadProgress";
import {
  type AvailabilityStatus,
  type BuiltInAIName,
  type CreateOptions,
  type CreateSessionOptions,
  type Session,
  availability,
  createSession,
  isSupported,
} from "./namespaces";

/**
 * Lifecycle status. Mirrors spec `Availability` (with `"available"` → `"ready"`)
 * and adds `"unsupported"`, `"checking"`, `"gesture-required"`, `"creating"`,
 * `"error"`.
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
   * Starts or retries session creation. Call from a user gesture when
   * `status` is `"downloadable"`, `"downloading"`, `"gesture-required"`, or
   * `"error"`; no-op otherwise. The gesture is only required before the
   * model is downloaded — once `status` reaches `"ready"`, verb calls
   * proceed without one.
   */
  create: () => void;
}

/**
 * Discriminated by `status`. `"ready"` narrows `session` to non-null;
 * `"error"` narrows `error` to non-null; otherwise both are `null`.
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
  session: Session<K> | null;
  error: Error | null;
  generation: number;
  force: boolean;
}

type Action<K extends BuiltInAIName> =
  | { type: "reset" }
  | { type: "checked"; availability: AvailabilityStatus; force: boolean }
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
        session: null,
        error: null,
        force: false,
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
    case "ready":
      return { ...state, status: "ready", session: action.session };
    case "unavailable":
      return { ...state, status: "unavailable" };
    case "gesture-required":
      return { ...state, status: "gesture-required" };
    case "failed":
      return { ...state, status: "error", error: action.error };
    case "retry":
      return { ...state, generation: state.generation + 1, force: true };
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
  progress: number,
  create: () => void,
): UseBuiltInAIResult<K> {
  const { status, session, error } = state;
  const base = { progress, create };
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
 * React binding for a built-in AI session. Probes availability, gates create
 * behind a user gesture when required, tracks download progress, and aborts
 * plus calls `destroy()` on unmount or identity change. `options` need not be
 * referentially stable — the hook re-runs only on deep-equal changes.
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
      session: null,
      error: null,
      generation: 0,
      force: false,
    }),
  );

  const progressKey = `${name}:${optionsKey}`;
  const storeProgress = useDownloadProgress(progressKey);
  const progress = state.status === "ready" ? 1 : storeProgress;

  const performRun = useEffectEvent(
    async (signal: AbortSignal): Promise<void> => {
      const force = state.force;
      dispatch({ type: "reset" });

      let status: AvailabilityStatus;
      try {
        status = await availability(name, options);
      } catch (error) {
        if (signal.aborted) {
          return;
        }
        dispatch({ type: "failed", error: toError(error) });
        return;
      }
      if (signal.aborted) {
        return;
      }

      dispatch({ type: "checked", availability: status, force });

      if (status === "unsupported" || status === "unavailable") {
        return;
      }
      if ((status === "downloadable" || status === "downloading") && !force) {
        return;
      }

      let session: Session<K> | null;
      try {
        // TS can't preserve the generic relation through the spread.
        session = await createSession(name, {
          ...options,
          signal,
          progressKey,
        } as CreateOptions<K> & CreateSessionOptions);
      } catch (error) {
        if (signal.aborted || isAbort(error)) {
          return;
        }
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

  useEffect(() => {
    if (!supported) {
      return;
    }
    const controller = new AbortController();
    void performRun(controller.signal);

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

  return toResult(state, progress, create);
}
