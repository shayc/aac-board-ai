import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle.ts";
import { streamChunks } from "../internal/stream.ts";
import type { BaseHookReturn } from "../internal/types.ts";

export interface WriterOptions {
  tone?: "formal" | "neutral" | "casual";
  format?: "plain-text" | "markdown";
  length?: "short" | "medium" | "long";
  sharedContext?: string;
  expectedInputLanguages?: readonly string[];
  expectedContextLanguages?: readonly string[];
  outputLanguage?: string;
}

export interface WriteCallOptions {
  context?: string;
  signal?: AbortSignal;
}

export interface WriterHookReturn extends BaseHookReturn {
  write: (input: string, options?: WriteCallOptions) => Promise<string>;
  writeStream: (
    input: string,
    options?: WriteCallOptions,
  ) => AsyncIterable<string>;
  measureInput: (input: string, options?: WriteCallOptions) => Promise<number>;
  inputQuota: number;
}

export function useWriter(options?: WriterOptions): WriterHookReturn {
  const lc = useLifecycle<WriterOptions, Writer>("Writer", options);

  const [api] = useState(() => ({
    write: async (input: string, opts?: WriteCallOptions) => {
      const { instance, signal } = await lc.acquire(opts?.signal);
      return instance.write(input, { context: opts?.context, signal });
    },
    writeStream: (
      input: string,
      opts?: WriteCallOptions,
    ): AsyncIterable<string> =>
      (async function* () {
        const { instance, signal } = await lc.acquire(opts?.signal);
        const stream = instance.writeStreaming(input, {
          context: opts?.context,
          signal,
        });
        yield* streamChunks(stream, signal);
      })(),
    measureInput: async (input: string, opts?: WriteCallOptions) => {
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
    write: api.write,
    writeStream: api.writeStream,
    measureInput: api.measureInput,
  };
}
