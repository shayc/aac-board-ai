import { useState } from "react";
import type { BaseHookReturn } from "../internal/lifecycle/types.ts";
import { useLifecycle } from "../internal/lifecycle/useLifecycle.ts";
import { streamChunks } from "../util/stream.ts";

/**
 * Options for {@link useRewriter}. Mirrors `Rewriter.create()` options.
 * Memoize array values — options are compared shallowly to drive re-creation.
 *
 * @see https://developer.chrome.com/docs/ai/rewriter-api
 */
export interface RewriterOptions {
  /** Voice adjustment relative to the input. `"as-is"` preserves the original tone. */
  tone?: "as-is" | "more-formal" | "more-casual";
  /** Output format. `"as-is"` preserves the input's format. */
  format?: "as-is" | "plain-text" | "markdown";
  /** Length adjustment relative to the input. */
  length?: "as-is" | "shorter" | "longer";
  /** Context shared across every call on this instance. */
  sharedContext?: string;
  /** BCP-47 tags of input languages the model should expect. */
  expectedInputLanguages?: readonly string[];
  /** BCP-47 tags of context languages the model should expect. */
  expectedContextLanguages?: readonly string[];
  /** BCP-47 tag of the desired output language. */
  outputLanguage?: string;
}

/** Per-call options for {@link useRewriter} action methods. */
export interface RewriteCallOptions {
  /** Context specific to this call, in addition to `sharedContext`. */
  context?: string;
  /** Cancels this call only; does not destroy the shared instance. */
  signal?: AbortSignal;
}

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
  /** Estimated usage of `input` against {@link inputQuota}. */
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
    useLifecycle<RewriterOptions, Rewriter>("Rewriter", options);

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
