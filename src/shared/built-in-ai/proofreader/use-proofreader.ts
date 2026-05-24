import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle/use-lifecycle";
import type { BaseHookReturn } from "../types";

/**
 * Options for {@link useProofreader}. Mirrors `Proofreader.create()`. Compared
 * shallowly — memoize `expectedInputLanguages` to avoid spurious re-creation.
 *
 * @see https://developer.chrome.com/docs/ai/proofreader-api
 */
export type ProofreaderOptions = ProofreaderCreateCoreOptions;

/** Per-call options for {@link useProofreader} action methods. */
export type ProofreadCallOptions = ProofreaderProofreadOptions;

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
