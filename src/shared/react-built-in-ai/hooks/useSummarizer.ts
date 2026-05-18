import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle.ts";
import { streamChunks } from "../internal/stream.ts";
import type { BaseHookReturn } from "../internal/types.ts";

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
  const lc = useLifecycle<SummarizerOptions, Summarizer>("Summarizer", options);

  const [api] = useState(() => ({
    summarize: async (input: string, opts?: SummarizeCallOptions) => {
      const { instance, signal } = await lc.acquire(opts?.signal);
      return instance.summarize(input, { context: opts?.context, signal });
    },
    summarizeStream: (
      input: string,
      opts?: SummarizeCallOptions,
    ): AsyncIterable<string> =>
      (async function* () {
        const { instance, signal } = await lc.acquire(opts?.signal);
        const stream = instance.summarizeStreaming(input, {
          context: opts?.context,
          signal,
        });
        yield* streamChunks(stream, signal);
      })(),
    measureInput: async (input: string, opts?: SummarizeCallOptions) => {
      const { instance, signal } = await lc.acquire(opts?.signal);
      return instance.measureInputUsage(input, {
        context: opts?.context,
        signal,
      });
    },
  }));

  return {
    status: lc.status,
    progress: lc.progress,
    error: lc.error,
    inputQuota: lc.inputQuota,
    prepare: lc.prepare,
    summarize: api.summarize,
    summarizeStream: api.summarizeStream,
    measureInput: api.measureInput,
  };
}
