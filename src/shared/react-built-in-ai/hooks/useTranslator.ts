import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle.ts";
import { streamChunks } from "../internal/stream.ts";
import type { BaseHookReturn } from "../internal/types.ts";

export interface TranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslateCallOptions {
  signal?: AbortSignal;
}

export interface TranslatorHookReturn extends BaseHookReturn {
  translate: (input: string, options?: TranslateCallOptions) => Promise<string>;
  translateStream: (
    input: string,
    options?: TranslateCallOptions,
  ) => AsyncIterable<string>;
  measureInput: (
    input: string,
    options?: TranslateCallOptions,
  ) => Promise<number>;
  inputQuota: number;
}

export function useTranslator(
  options: TranslatorOptions,
): TranslatorHookReturn {
  const lc = useLifecycle<TranslatorOptions, Translator>("Translator", options);

  const [api] = useState(() => ({
    translate: async (input: string, opts?: TranslateCallOptions) => {
      const { instance, signal } = await lc.acquire(opts?.signal);
      return instance.translate(input, { signal });
    },
    translateStream: (
      input: string,
      opts?: TranslateCallOptions,
    ): AsyncIterable<string> =>
      (async function* () {
        const { instance, signal } = await lc.acquire(opts?.signal);
        const stream = instance.translateStreaming(input, { signal });
        yield* streamChunks(stream, signal);
      })(),
    measureInput: async (input: string, opts?: TranslateCallOptions) => {
      const { instance, signal } = await lc.acquire(opts?.signal);
      return instance.measureInputUsage(input, { signal });
    },
  }));

  return {
    status: lc.status,
    progress: lc.progress,
    error: lc.error,
    inputQuota: lc.inputQuota,
    prepare: lc.prepare,
    translate: api.translate,
    translateStream: api.translateStream,
    measureInput: api.measureInput,
  };
}
