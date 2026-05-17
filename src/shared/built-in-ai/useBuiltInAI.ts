import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  type BuiltInAIName,
  type CreateOptions,
  type Session,
  availability,
  createSession,
} from "./built-in-ai";

export type AIStatus =
  | "unsupported" // global missing — terminal
  | "checking" // availability() probe in flight
  | "unavailable" // model can't run here — terminal until identity change
  | "downloadable" // needs a user gesture to start download (call create())
  | "downloading" // model downloading; `progress` is live
  | "creating" // create() in flight for an already-available model
  | "ready" // `session` usable
  | "error"; // create() failed (non-abort) — retry via create()

export interface UseBuiltInAIResult<K extends BuiltInAIName> {
  status: AIStatus;
  /** Model download progress, a `0..1` fraction. */
  progress: number;
  /** Non-null iff `status === "ready"`. */
  session: Session<K> | null;
  /** Non-null iff `status === "error"`. */
  error: Error | null;
  /**
   * Aborts on unmount / identity change. Pass to verb calls so they die with
   * the hook: `session.translate(text, { signal })`.
   */
  signal: AbortSignal;
  /**
   * Start (or retry) create. Call from a user-gesture handler when the model
   * must download. No-op while "checking" / "creating" / "ready".
   */
  create: () => void;
}

export interface UseBuiltInAIOptions {
  /**
   * `"auto"` (default): auto-create when the model is already available; wait
   * for `create()` (a user gesture) before starting a download. `"eager"`:
   * auto-create even when a download is needed (caller asserts a gesture).
   */
  mode?: "auto" | "eager";
  /** Identity override; defaults to a stable key over `options`. */
  key?: string;
}

interface State<K extends BuiltInAIName> {
  status: AIStatus;
  progress: number;
  session: Session<K> | null;
  error: Error | null;
  signal: AbortSignal;
}

type Action<K extends BuiltInAIName> =
  | { type: "reset"; status: AIStatus; signal: AbortSignal }
  | { type: "status"; status: AIStatus }
  | { type: "progress"; progress: number }
  | { type: "ready"; session: Session<K> }
  | { type: "error"; error: Error };

function reducer<K extends BuiltInAIName>(
  state: State<K>,
  action: Action<K>,
): State<K> {
  switch (action.type) {
    case "reset":
      return {
        status: action.status,
        progress: 0,
        session: null,
        error: null,
        signal: action.signal,
      };
    case "status":
      return { ...state, status: action.status };
    case "progress":
      return { ...state, status: "downloading", progress: action.progress };
    case "ready":
      return {
        ...state,
        status: "ready",
        progress: 1,
        session: action.session,
      };
    case "error":
      return { ...state, status: "error", error: action.error };
  }
}

/** Recursive sorted-key serialization — stable for these flat option bags. */
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
 * React binding over a built-in AI session. Owns the full lifecycle —
 * availability probe, gesture-gated create, download progress, abort on
 * unmount/identity-change, and `destroy()` — so no consumer can forget a step.
 */
export function useBuiltInAI<K extends BuiltInAIName>(
  name: K,
  options?: CreateOptions<K>,
  hookOptions?: UseBuiltInAIOptions,
): UseBuiltInAIResult<K> {
  const supported = name in globalThis;
  const [state, dispatch] = useReducer(
    reducer<K>,
    undefined,
    (): State<K> => ({
      status: supported ? "checking" : "unsupported",
      progress: 0,
      session: null,
      error: null,
      signal: new AbortController().signal,
    }),
  );

  const mode = hookOptions?.mode ?? "auto";
  const key = hookOptions?.key ?? `${name}:${stableKey(options)}`;

  const optionsRef = useRef(options);
  const stateRef = useRef(state);
  const manualRef = useRef(false);
  const [tick, bump] = useReducer((n: number): number => n + 1, 0);

  useEffect(() => {
    optionsRef.current = options;
    stateRef.current = state;
  });

  const create = useCallback(() => {
    const { status } = stateRef.current;
    if (status === "checking" || status === "creating" || status === "ready") {
      return;
    }
    manualRef.current = true;
    bump();
  }, []);

  useEffect(() => {
    if (!(name in globalThis)) {
      dispatch({
        type: "reset",
        status: "unsupported",
        signal: new AbortController().signal,
      });
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    let session: Session<K> | null = null;
    dispatch({ type: "reset", status: "checking", signal });

    void (async () => {
      let availabilityStatus;
      try {
        availabilityStatus = await availability(name, optionsRef.current);
      } catch (error) {
        if (signal.aborted) return;
        dispatch({ type: "error", error: toError(error) });
        return;
      }
      if (signal.aborted) return;

      if (
        availabilityStatus === "unsupported" ||
        availabilityStatus === "unavailable"
      ) {
        dispatch({ type: "status", status: availabilityStatus });
        return;
      }

      const startCreate = (status: "creating" | "downloading") => {
        dispatch({ type: "status", status });
        void createSession(name, {
          ...optionsRef.current,
          signal,
          onProgress: (progress: number) => {
            if (!signal.aborted) {
              dispatch({ type: "progress", progress });
            }
          },
        })
          .then((created) => {
            if (signal.aborted) {
              created?.destroy();
              return;
            }
            session = created;
            if (created) {
              dispatch({ type: "ready", session: created });
            } else {
              dispatch({ type: "status", status: "unavailable" });
            }
          })
          .catch((error: unknown) => {
            if (signal.aborted || isAbort(error)) return;
            dispatch({ type: "error", error: toError(error) });
          });
      };

      if (availabilityStatus === "available") {
        startCreate("creating");
        return;
      }

      // availabilityStatus: "downloadable" | "downloading"
      const manual = manualRef.current;
      manualRef.current = false;
      if (mode === "eager" || manual) {
        startCreate("downloading");
        return;
      }
      dispatch({ type: "status", status: availabilityStatus });
    })();

    return () => {
      controller.abort();
      session?.destroy();
    };
  }, [key, tick, name, mode]);

  return {
    status: state.status,
    progress: state.progress,
    session: state.session,
    error: state.error,
    signal: state.signal,
    create,
  };
}

export const useTranslator = (
  options: CreateOptions<"Translator">,
  hookOptions?: UseBuiltInAIOptions,
): UseBuiltInAIResult<"Translator"> =>
  useBuiltInAI("Translator", options, hookOptions);

export const useRewriter = (
  options?: CreateOptions<"Rewriter">,
  hookOptions?: UseBuiltInAIOptions,
): UseBuiltInAIResult<"Rewriter"> =>
  useBuiltInAI("Rewriter", options, hookOptions);

export const useProofreader = (
  options?: CreateOptions<"Proofreader">,
  hookOptions?: UseBuiltInAIOptions,
): UseBuiltInAIResult<"Proofreader"> =>
  useBuiltInAI("Proofreader", options, hookOptions);
