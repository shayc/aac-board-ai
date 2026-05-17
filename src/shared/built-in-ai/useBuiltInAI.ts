import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AvailabilityStatus,
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
   * must download, or to retry after an error. No-op otherwise.
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
): UseBuiltInAIResult<K> {
  const supported = name in globalThis;
  const optionsKey = stableKey(options);

  // Latest options for the effect's async closures, without retriggering on
  // every render. Read-only outside render.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [state, setState] = useState<State<K>>(() => ({
    status: supported ? "checking" : "unsupported",
    progress: 0,
    session: null,
    error: null,
    signal: new AbortController().signal,
  }));

  // Populated by the effect whenever it parks awaiting a user gesture (or a
  // retry after error). `create()` simply invokes it.
  const pendingCreateRef = useRef<(() => void) | null>(null);
  const create = useCallback(() => pendingCreateRef.current?.(), []);

  useEffect(() => {
    if (!supported) return;

    const controller = new AbortController();
    const { signal } = controller;
    let session: Session<K> | null = null;

    // One linear lifecycle pass: probe, then auto-create, park for gesture, or
    // settle into a terminal status. Re-entered with `force = true` when the
    // user calls `create()`.
    const run = async (force: boolean): Promise<void> => {
      pendingCreateRef.current = null;
      setState((s) => ({
        ...s,
        status: "checking",
        progress: 0,
        error: null,
        signal,
      }));

      let status: AvailabilityStatus;
      try {
        status = await availability(name, optionsRef.current);
      } catch (error) {
        if (signal.aborted) return;
        setState((s) => ({ ...s, status: "error", error: toError(error) }));
        pendingCreateRef.current = () => void run(true);
        return;
      }
      if (signal.aborted) return;

      if (status === "unsupported" || status === "unavailable") {
        setState((s) => ({ ...s, status }));
        return;
      }

      if (status === "downloadable" || status === "downloading") {
        if (!force) {
          setState((s) => ({ ...s, status }));
          pendingCreateRef.current = () => void run(true);
          return;
        }
        setState((s) => ({ ...s, status: "downloading" }));
      } else {
        setState((s) => ({ ...s, status: "creating" }));
      }

      try {
        session = await createSession(name, {
          ...optionsRef.current,
          signal,
          onProgress: (progress) => {
            if (!signal.aborted) {
              setState((s) => ({ ...s, status: "downloading", progress }));
            }
          },
        });
      } catch (error) {
        if (signal.aborted || isAbort(error)) return;
        setState((s) => ({ ...s, status: "error", error: toError(error) }));
        pendingCreateRef.current = () => void run(true);
        return;
      }
      if (signal.aborted) {
        session?.destroy();
        session = null;
        return;
      }
      if (!session) {
        setState((s) => ({ ...s, status: "unavailable" }));
        return;
      }
      setState((s) => ({ ...s, status: "ready", progress: 1, session }));
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
