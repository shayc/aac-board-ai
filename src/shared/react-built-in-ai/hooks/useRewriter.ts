import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle.ts";
import { streamChunks } from "../internal/stream.ts";
import type { BaseHookReturn } from "../internal/types.ts";

export interface RewriterOptions {
  tone?: "as-is" | "more-formal" | "more-casual";
  format?: "as-is" | "plain-text" | "markdown";
  length?: "as-is" | "shorter" | "longer";
  sharedContext?: string;
  expectedInputLanguages?: readonly string[];
  expectedContextLanguages?: readonly string[];
  outputLanguage?: string;
}

export interface RewriteCallOptions {
  context?: string;
  signal?: AbortSignal;
}

export interface RewriterHookReturn extends BaseHookReturn {
  rewrite: (input: string, options?: RewriteCallOptions) => Promise<string>;
  rewriteStream: (
    input: string,
    options?: RewriteCallOptions,
  ) => AsyncIterable<string>;
  measureInput: (
    input: string,
    options?: RewriteCallOptions,
  ) => Promise<number>;
  inputQuota: number;
}

export function useRewriter(options?: RewriterOptions): RewriterHookReturn {
  const { acquire, ...lifecycle } = useLifecycle<RewriterOptions, Rewriter>(
    "Rewriter",
    options,
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

  return { ...lifecycle, ...actions };
}
