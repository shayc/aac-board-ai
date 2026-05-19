import { useState } from "react";
import { streamChunks } from "../internal/stream.ts";
import type { BaseHookReturn } from "../internal/types.ts";
import { useLifecycle } from "../internal/useLifecycle.ts";

/**
 * Options for {@link useSummarizer}. Mirrors `Summarizer.create()` options.
 * Memoize array values — options are compared shallowly to drive re-creation.
 *
 * @see https://developer.chrome.com/docs/ai/summarizer-api
 */
export interface SummarizerOptions {
  /** Summary style. */
  type?: "tldr" | "teaser" | "key-points" | "headline";
  /** Output format. */
  format?: "plain-text" | "markdown";
  /** Target summary length. */
  length?: "short" | "medium" | "long";
  /** Context shared across every call on this instance. */
  sharedContext?: string;
  /** BCP-47 tags of input languages the model should expect. */
  expectedInputLanguages?: readonly string[];
  /** BCP-47 tags of context languages the model should expect. */
  expectedContextLanguages?: readonly string[];
  /** BCP-47 tag of the desired output language. */
  outputLanguage?: string;
}

/** Per-call options for {@link useSummarizer} action methods. */
export interface SummarizeCallOptions {
  /** Context specific to this call, in addition to `sharedContext`. */
  context?: string;
  /** Cancels this call only; does not destroy the shared instance. */
  signal?: AbortSignal;
}

/**
 * Return value of {@link useSummarizer}. Extends {@link BaseHookReturn} with
 * the Summarizer action methods.
 */
export interface SummarizerHookReturn extends BaseHookReturn {
  /**
   * Summarizes `input` and resolves with the full result.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  summarize: (input: string, options?: SummarizeCallOptions) => Promise<string>;
  /**
   * Streams the summary as it is produced. Concatenating all chunks yields the
   * same result as {@link summarize}.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  summarizeStream: (
    input: string,
    options?: SummarizeCallOptions,
  ) => AsyncIterable<string>;
  /** Estimated usage of `input` against {@link inputQuota}. */
  measureInput: (
    input: string,
    options?: SummarizeCallOptions,
  ) => Promise<number>;
  /** Maximum input the current instance accepts. `0` until `status` is `"ready"`. */
  inputQuota: number;
}

/**
 * React hook around the browser's [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api).
 * See {@link BaseHookReturn} for the lifecycle and gating rules.
 *
 * @example
 * ```tsx
 * function Summary({ text }: { text: string }) {
 *   const summarizer = useSummarizer({ type: "tldr" });
 *   return (
 *     <button
 *       disabled={summarizer.status === "downloading"}
 *       onClick={async () => setOutput(await summarizer.summarize(text))}
 *     >
 *       Summarize
 *     </button>
 *   );
 * }
 * ```
 */
export function useSummarizer(
  options?: SummarizerOptions,
): SummarizerHookReturn {
  const { status, progress, error, prepare, inputQuota, acquire } =
    useLifecycle<SummarizerOptions, Summarizer>("Summarizer", options);

  const [actions] = useState(() => ({
    async summarize(input: string, opts?: SummarizeCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.summarize(input, { context: opts?.context, signal });
    },
    async *summarizeStream(
      input: string,
      opts?: SummarizeCallOptions,
    ): AsyncIterable<string> {
      const { instance, signal } = await acquire(opts?.signal);
      const stream = instance.summarizeStreaming(input, {
        context: opts?.context,
        signal,
      });
      yield* streamChunks(stream, signal);
    },
    async measureInput(input: string, opts?: SummarizeCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.measureInputUsage(input, {
        context: opts?.context,
        signal,
      });
    },
  }));

  return { status, progress, error, prepare, inputQuota, ...actions };
}
