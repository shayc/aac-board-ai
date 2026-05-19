import { streamChunks } from "../internal/stream.ts";
import type { BaseHookReturn } from "../internal/types.ts";
import { useLifecycle } from "../internal/useLifecycle.ts";

export interface SummarizerOptions {
  type?: "tldr" | "teaser" | "key-points" | "headline";
  format?: "plain-text" | "markdown";
  length?: "short" | "medium" | "long";
  sharedContext?: string;
  expectedInputLanguages?: readonly string[];
  expectedContextLanguages?: readonly string[];
  outputLanguage?: string;
}

export interface SummarizeCallOptions {
  context?: string;
  signal?: AbortSignal;
}

export interface SummarizerHookReturn extends BaseHookReturn {
  summarize: (input: string, options?: SummarizeCallOptions) => Promise<string>;
  summarizeStream: (
    input: string,
    options?: SummarizeCallOptions,
  ) => AsyncIterable<string>;
  measureInput: (
    input: string,
    options?: SummarizeCallOptions,
  ) => Promise<number>;
  inputQuota: number;
}

export function useSummarizer(
  options?: SummarizerOptions,
): SummarizerHookReturn {
  const { acquire, ...lifecycle } = useLifecycle<SummarizerOptions, Summarizer>(
    "Summarizer",
    options,
  );

  async function summarize(input: string, opts?: SummarizeCallOptions) {
    const { instance, signal } = await acquire(opts?.signal);
    return instance.summarize(input, { context: opts?.context, signal });
  }

  async function* summarizeStream(
    input: string,
    opts?: SummarizeCallOptions,
  ): AsyncIterable<string> {
    const { instance, signal } = await acquire(opts?.signal);
    const stream = instance.summarizeStreaming(input, {
      context: opts?.context,
      signal,
    });
    yield* streamChunks(stream, signal);
  }

  async function measureInput(input: string, opts?: SummarizeCallOptions) {
    const { instance, signal } = await acquire(opts?.signal);
    return instance.measureInputUsage(input, {
      context: opts?.context,
      signal,
    });
  }

  return { ...lifecycle, summarize, summarizeStream, measureInput };
}
