// useProofreader.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Minimal shape derived from Chrome's Proofreader explainer/docs */
export interface ProofreadCorrection {
  startIndex: number;
  endIndex: number;
  correction: string;
}

export interface ProofreadResult {
  correctedInput: string;
  corrections: ProofreadCorrection[];
}

/** Status of this hook's lifecycle */
export type ProofreaderStatus =
  | "checking" // running availability()
  | "unsupported" // API not present (or SSR)
  | "unavailable" // present but can't be used on this device/profile
  | "downloadable" // available after model download
  | "downloading" // model is downloading
  | "ready" // session created and callable
  | "error"; // unrecoverable error state

export interface UseProofreaderOptions {
  /** e.g. ["en"] */
  expectedInputLanguages?: string[];

  /**
   * If you want the hook to automatically call availability() on mount (default true).
   * The actual model download and create() still require an explicit user gesture you invoke via requestSession().
   */
  checkOnMount?: boolean;
}

export interface UseProofreader {
  /** Current status */
  status: ProofreaderStatus;

  /** 0..1 while downloading; null otherwise */
  progress: number | null;

  /** Availability string returned by the native API (if any) */
  availability: string | null;

  /** Any error that occurred */
  error: Error | null;

  /** True when a session has been created and is ready */
  isReady: boolean;

  /**
   * Must be called from a user gesture (e.g., onClick).
   * Triggers model download (with progress) and creates the session.
   */
  requestSession: () => Promise<void>;

  /**
   * Proofread text. Throws if not ready.
   * Accepts an optional AbortSignal for cancellation.
   */
  proofread: (input: string, signal?: AbortSignal) => Promise<ProofreadResult>;

  /** Destroy the session to free resources */
  destroy: () => void;
}

/** Narrow interface for the global API without importing DOM lib proposals */
interface NativeProofreader {
  availability: (mode?: string) => Promise<string> | string;
  create: (opts: {
    expectedInputLanguages?: string[];
    monitor?: (m: EventTarget) => void;
    signal?: AbortSignal;
  }) => Promise<{
    proofread: (
      input: string,
      opts?: { signal?: AbortSignal }
    ) => Promise<ProofreadResult>;
    destroy?: () => void;
  }>;
}

function getNative(): NativeProofreader | null {
  if (typeof window === "undefined") return null;
  // Proposal API lives on window in origin trial
  return (window as { Proofreader?: NativeProofreader }).Proofreader ?? null;
}

export function useProofreader(
  options: UseProofreaderOptions = {}
): UseProofreader {
  const { expectedInputLanguages = ["en"], checkOnMount = true } = options;

  const native = useMemo(() => getNative(), []);
  const [status, setStatus] = useState<ProofreaderStatus>(() =>
    native ? "checking" : "unsupported"
  );
  const [availability, setAvailability] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const sessionRef = useRef<Awaited<
    ReturnType<NonNullable<NativeProofreader>["create"]>
  > | null>(null);
  const downloadAbortRef = useRef<AbortController | null>(null);

  const isReady = status === "ready" && !!sessionRef.current;

  // Initial availability() check (pure read; no download)
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!checkOnMount) return;
      if (!native) return; // status already "unsupported"

      try {
        setStatus("checking");
        const avail = native.availability
          ? await native.availability("downloadable")
          : null;
        if (cancelled) return;

        const value = typeof avail === "string" ? avail : String(avail);
        setAvailability(value);

        // Typical values observed: "downloadable", "ready", "unavailable"
        if (value.toLowerCase().includes("ready")) {
          // Some builds may already have the model; we still need a session via create()
          setStatus("downloadable");
        } else if (value.toLowerCase().includes("downloadable")) {
          setStatus("downloadable");
        } else {
          setStatus("unavailable");
        }
      } catch (e) {
        if (cancelled) return;
        setError(e as Error);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [native, checkOnMount]);

  const destroy = useCallback(() => {
    try {
      downloadAbortRef.current?.abort();
      downloadAbortRef.current = null;
    } catch {
      /* no-op */
    }
    try {
      sessionRef.current?.destroy?.();
    } catch {
      /* no-op */
    }
    sessionRef.current = null;
    setProgress(null);
    // If API exists, go back to downloadable/unavailable based on last known availability
    if (!native) {
      setStatus("unsupported");
    } else if (
      (availability ?? "").toLowerCase().includes("downloadable") ||
      (availability ?? "").toLowerCase().includes("ready")
    ) {
      setStatus("downloadable");
    } else {
      setStatus("unavailable");
    }
  }, [availability, native]);

  const requestSession = useCallback(async () => {
    if (!native) {
      setStatus("unsupported");
      throw new Error("Proofreader API not available in this environment.");
    }
    if (sessionRef.current) {
      // Already created
      setStatus("ready");
      return;
    }

    // Must be called within a user gesture in browsers that require it.
    setError(null);
    setProgress(0);
    setStatus("downloading");

    const abort = new AbortController();
    downloadAbortRef.current = abort;

    try {
      const proofreader = await native.create({
        expectedInputLanguages,
        signal: abort.signal,
        monitor(m: EventTarget) {
          // The monitor EventTarget emits "downloadprogress" events
          // with an event { loaded: 0..1 }
          // We keep it resilient if shape differs in future builds.
          m.addEventListener("downloadprogress", (e: Event) => {
            try {
              const loaded = typeof (e as unknown as { loaded?: unknown }).loaded === "number"
                ? (e as unknown as { loaded: number }).loaded
                : null;
              if (loaded != null && !Number.isNaN(loaded)) {
                setProgress(Math.max(0, Math.min(1, loaded)));
              }
            } catch {
              // swallow to avoid breaking UI
            }
          });
        },
      });

      sessionRef.current = proofreader;
      setProgress(1);
      setStatus("ready");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError(new Error("Model download/create was aborted."));
      } else {
        setError(e as Error);
      }
      setStatus("error");
      setProgress(null);
      downloadAbortRef.current = null;
      throw e;
    }
  }, [native, expectedInputLanguages]);

  const proofread = useCallback<UseProofreader["proofread"]>(
    async (input, signal) => {
      if (!sessionRef.current) {
        throw new Error(
          "Proofreader session is not ready. Call requestSession() from a user gesture first."
        );
      }
      // Support cancellation per call
      return sessionRef.current.proofread(input, { signal });
    },
    []
  );

  // Clean up on unmount
  useEffect(() => () => destroy(), [destroy]);

  return {
    status,
    availability,
    progress,
    error,
    isReady,
    requestSession,
    proofread,
    destroy,
  };
}
