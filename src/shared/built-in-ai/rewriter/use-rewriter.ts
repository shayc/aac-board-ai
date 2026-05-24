import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle/use-lifecycle";
import { streamChunks } from "../internal/stream";
import type { BaseHookReturn } from "../types";

/**
 * Options for {@link useRewriter}. Mirrors `Rewriter.create()` minus the
 * hook-managed `signal` and `monitor`. Compared shallowly — memoize array
 * values to avoid spurious re-creation.
 *
 * @see https://developer.chrome.com/docs/ai/rewriter-api
 */
export type RewriterOptions = Omit<RewriterCreateOptions, "signal" | "monitor">;

/** Per-call options for {@link useRewriter} action methods. */
export type RewriteCallOptions = RewriterRewriteOptions;

/**
 * Return value of {@link useRewriter}. Extends {@link BaseHookReturn} with the
 * Rewriter action methods.
 */
export interface RewriterHookReturn extends BaseHookReturn {
  /**
   * Rewrites `input` and resolves with the full result.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  rewrite: (input: string, options?: RewriteCallOptions) => Promise<string>;
  /**
   * Streams the rewrite as it is produced. Concatenating all chunks yields the
   * same result as {@link rewrite}.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  rewriteStream: (
    input: string,
    options?: RewriteCallOptions,
  ) => AsyncIterable<string>;
  /**
   * Estimated usage of `input` against {@link RewriterHookReturn.inputQuota}.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  measureInput: (
    input: string,
    options?: RewriteCallOptions,
  ) => Promise<number>;
  /** Maximum input the current instance accepts. `0` until `status` is `"ready"`. */
  inputQuota: number;
}

/**
 * React hook around the browser's [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api).
 * See {@link BaseHookReturn} for the lifecycle and gating rules.
 *
 * @example
 * ```tsx
 * function PoliteRephrase({ draft }: { draft: string }) {
 *   const rewriter = useRewriter({ tone: "more-formal" });
 *   return (
 *     <button
 *       disabled={rewriter.status === "downloading"}
 *       onClick={async () => setOutput(await rewriter.rewrite(draft))}
 *     >
 *       Make it polite
 *     </button>
 *   );
 * }
 * ```
 */
export function useRewriter(options?: RewriterOptions): RewriterHookReturn {
  const { status, progress, error, prepare, inputQuota, acquire } =
    useLifecycle<RewriterOptions, Rewriter>(
      "Rewriter",
      options,
      (instance) => instance.inputQuota,
    );

  const [actions] = useState(() => ({
    async rewrite(input: string, opts?: RewriteCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.rewrite(input, { context: opts?.context, signal });
    },
    async *rewriteStream(
      input: string,
      opts?: RewriteCallOptions,
    ): AsyncIterable<string> {
      const { instance, signal } = await acquire(opts?.signal);
      const stream = instance.rewriteStreaming(input, {
        context: opts?.context,
        signal,
      });
      yield* streamChunks(stream, signal);
    },
    async measureInput(input: string, opts?: RewriteCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.measureInputUsage(input, {
        context: opts?.context,
        signal,
      });
    },
  }));

  return { status, progress, error, prepare, inputQuota, ...actions };
}
