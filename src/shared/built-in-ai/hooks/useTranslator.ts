import { useState } from "react";
import { streamChunks } from "../internal/stream.ts";
import type { BaseHookReturn } from "../internal/types.ts";
import { useLifecycle } from "../internal/useLifecycle.ts";

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
  const { status, progress, error, prepare, inputQuota, acquire } =
    useLifecycle<TranslatorOptions, Translator>("Translator", options);

  const [actions] = useState(() => ({
    async translate(input: string, opts?: TranslateCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.translate(input, { signal });
    },
    async *translateStream(
      input: string,
      opts?: TranslateCallOptions,
    ): AsyncIterable<string> {
      const { instance, signal } = await acquire(opts?.signal);
      const stream = instance.translateStreaming(input, { signal });
      yield* streamChunks(stream, signal);
    },
    async measureInput(input: string, opts?: TranslateCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.measureInputUsage(input, { signal });
    },
  }));

  return { status, progress, error, prepare, inputQuota, ...actions };
}
