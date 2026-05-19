import { useState } from "react";
import { streamChunks } from "../internal/stream.ts";
import type { BaseHookReturn } from "../internal/types.ts";
import { useLifecycle } from "../internal/useLifecycle.ts";

/**
 * Options for {@link useWriter}. Mirrors `Writer.create()` options.
 * Memoize array values — options are compared shallowly to drive re-creation.
 *
 * @see https://developer.chrome.com/docs/ai/writer-api
 */
export interface WriterOptions {
  /** Voice of the generated output. */
  tone?: "formal" | "neutral" | "casual";
  /** Output format. */
  format?: "plain-text" | "markdown";
  /** Target length. */
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

/** Per-call options for {@link useWriter} action methods. */
export interface WriteCallOptions {
  /** Context specific to this call, in addition to `sharedContext`. */
  context?: string;
  /** Cancels this call only; does not destroy the shared instance. */
  signal?: AbortSignal;
}

/**
 * Return value of {@link useWriter}. Extends {@link BaseHookReturn} with the
 * Writer action methods.
 */
export interface WriterHookReturn extends BaseHookReturn {
  /**
   * Generates writing from `input` (a prompt or brief) and resolves with the
   * full result.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  write: (input: string, options?: WriteCallOptions) => Promise<string>;
  /**
   * Streams the generated writing as it is produced. Concatenating all chunks
   * yields the same result as {@link write}.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  writeStream: (
    input: string,
    options?: WriteCallOptions,
  ) => AsyncIterable<string>;
  /** Estimated usage of `input` against {@link inputQuota}. */
  measureInput: (input: string, options?: WriteCallOptions) => Promise<number>;
  /** Maximum input the current instance accepts. `0` until `status` is `"ready"`. */
  inputQuota: number;
}

/**
 * React hook around the browser's [Writer API](https://developer.chrome.com/docs/ai/writer-api).
 * See {@link BaseHookReturn} for the lifecycle and gating rules.
 *
 * @example
 * ```tsx
 * function Compose() {
 *   const writer = useWriter({ tone: "neutral" });
 *   return (
 *     <button
 *       disabled={writer.status === "downloading"}
 *       onClick={async () => setDraft(await writer.write("…"))}
 *     >
 *       Draft
 *     </button>
 *   );
 * }
 * ```
 */
export function useWriter(options?: WriterOptions): WriterHookReturn {
  const { status, progress, error, prepare, inputQuota, acquire } =
    useLifecycle<WriterOptions, Writer>("Writer", options);

  const [actions] = useState(() => ({
    async write(input: string, opts?: WriteCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.write(input, { context: opts?.context, signal });
    },
    async *writeStream(
      input: string,
      opts?: WriteCallOptions,
    ): AsyncIterable<string> {
      const { instance, signal } = await acquire(opts?.signal);
      const stream = instance.writeStreaming(input, {
        context: opts?.context,
        signal,
      });
      yield* streamChunks(stream, signal);
    },
    async measureInput(input: string, opts?: WriteCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.measureInputUsage(input, {
        context: opts?.context,
        signal,
      });
    },
  }));

  return { status, progress, error, prepare, inputQuota, ...actions };
}
