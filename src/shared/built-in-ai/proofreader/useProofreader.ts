import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle/useLifecycle.ts";
import type { BaseHookReturn } from "../types.ts";

/**
 * Options for {@link useProofreader}. Mirrors `Proofreader.create()`. Compared
 * shallowly — memoize `expectedInputLanguages` to avoid spurious re-creation.
 *
 * @see https://developer.chrome.com/docs/ai/proofreader-api
 */
export interface ProofreaderOptions {
  /** Tag each correction with its kind (spelling, grammar, …). */
  includeCorrectionTypes?: boolean;
  /** Include a human-readable rationale on each correction. */
  includeCorrectionExplanations?: boolean;
  /** BCP-47 tag of the language used for explanations. */
  correctionExplanationLanguage?: string;
  /**
   * BCP-47 tags of input languages this instance will receive. Affects
   * `availability()` — unsupported languages can make the model unavailable.
   */
  expectedInputLanguages?: readonly string[];
}

/** Per-call options for {@link useProofreader} action methods. */
export interface ProofreadCallOptions {
  /** Cancels this call only; does not destroy the shared instance. */
  signal?: AbortSignal;
}

/**
 * Return value of {@link useProofreader}. Extends {@link BaseHookReturn} with
 * the Proofreader action method.
 *
 * Unlike the other hooks, this surface omits `measureInput` and `inputQuota`:
 * the underlying browser API exposes neither.
 */
export interface ProofreaderHookReturn extends BaseHookReturn {
  /**
   * Proofreads `input` and resolves with the browser's `ProofreadResult`.
   * Streaming is not supported by the underlying API.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  proofread: (
    input: string,
    options?: ProofreadCallOptions,
  ) => Promise<ProofreadResult>;
}

/**
 * React hook around the browser's [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api).
 * See {@link BaseHookReturn} for the lifecycle and gating rules.
 *
 * @example
 * ```tsx
 * function Proof({ text }: { text: string }) {
 *   const proofreader = useProofreader({ includeCorrectionTypes: true });
 *   return (
 *     <button
 *       disabled={proofreader.status === "downloading"}
 *       onClick={async () => {
 *         const result = await proofreader.proofread(text);
 *         setCorrections(result.corrections);
 *       }}
 *     >
 *       Proofread
 *     </button>
 *   );
 * }
 * ```
 */
export function useProofreader(
  options?: ProofreaderOptions,
): ProofreaderHookReturn {
  const { status, progress, error, prepare, acquire } = useLifecycle<
    ProofreaderOptions,
    Proofreader
  >("Proofreader", options);

  const [actions] = useState(() => ({
    async proofread(
      input: string,
      opts?: ProofreadCallOptions,
    ): Promise<ProofreadResult> {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.proofread(input, { signal });
    },
  }));

  return { status, progress, error, prepare, ...actions };
}
