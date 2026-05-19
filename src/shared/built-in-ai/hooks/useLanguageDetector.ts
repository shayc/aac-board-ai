import { useState } from "react";
import type { BaseHookReturn } from "../internal/types.ts";
import { useLifecycle } from "../internal/useLifecycle.ts";

/**
 * Options for {@link useLanguageDetector}. Mirrors `LanguageDetector.create()`
 * options. Memoize `expectedInputLanguages` — options are compared shallowly
 * to drive re-creation.
 *
 * @see https://developer.chrome.com/docs/ai/language-detection
 */
export interface LanguageDetectorOptions {
  /** BCP-47 tags of input languages the model should expect. */
  expectedInputLanguages?: readonly string[];
}

/** Per-call options for {@link useLanguageDetector} action methods. */
export interface DetectCallOptions {
  /** Cancels this call only; does not destroy the shared instance. */
  signal?: AbortSignal;
}

/**
 * One candidate language returned by `detect`. The browser may return multiple
 * candidates ordered by descending {@link confidence}.
 */
export interface LanguageDetectionResult {
  /** BCP-47 tag of the candidate language, or `undefined` when the model can't determine one. */
  detectedLanguage?: string;
  /** Confidence in `[0, 1]`, or `undefined` when the browser declines to score. */
  confidence?: number;
}

/**
 * Return value of {@link useLanguageDetector}. Extends {@link BaseHookReturn}
 * with the LanguageDetector action methods.
 */
export interface LanguageDetectorHookReturn extends BaseHookReturn {
  /**
   * Detects the language(s) of `input`. Resolves with candidates ordered by
   * descending {@link LanguageDetectionResult.confidence}.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  detect: (
    input: string,
    options?: DetectCallOptions,
  ) => Promise<LanguageDetectionResult[]>;
  /** Estimated usage of `input` against {@link inputQuota}. */
  measureInput: (input: string, options?: DetectCallOptions) => Promise<number>;
  /** Maximum input the current instance accepts. `0` until `status` is `"ready"`. */
  inputQuota: number;
}

/**
 * React hook around the browser's [Language Detector API](https://developer.chrome.com/docs/ai/language-detection).
 * See {@link BaseHookReturn} for the lifecycle and gating rules.
 *
 * @example
 * ```tsx
 * function GuessLanguage({ text }: { text: string }) {
 *   const detector = useLanguageDetector();
 *   return (
 *     <button
 *       disabled={detector.status === "downloading"}
 *       onClick={async () => {
 *         const [top] = await detector.detect(text);
 *         setLanguage(top?.detectedLanguage);
 *       }}
 *     >
 *       Detect
 *     </button>
 *   );
 * }
 * ```
 */
export function useLanguageDetector(
  options?: LanguageDetectorOptions,
): LanguageDetectorHookReturn {
  const { status, progress, error, prepare, inputQuota, acquire } =
    useLifecycle<LanguageDetectorOptions, LanguageDetector>(
      "LanguageDetector",
      options,
    );

  const [actions] = useState(() => ({
    async detect(input: string, opts?: DetectCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.detect(input, { signal });
    },
    async measureInput(input: string, opts?: DetectCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.measureInputUsage(input, { signal });
    },
  }));

  return { status, progress, error, prepare, inputQuota, ...actions };
}
