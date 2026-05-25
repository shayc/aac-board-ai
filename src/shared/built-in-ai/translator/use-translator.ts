import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle/use-lifecycle";
import { streamChunks } from "../internal/stream";
import type { BaseHookReturn } from "../types";

/**
 * Options for {@link useTranslator}. Changing either field destroys the
 * current instance and re-enters the lifecycle for the new pair.
 *
 * @see https://developer.chrome.com/docs/ai/translator-api
 */
export type TranslatorOptions = Omit<
  TranslatorCreateOptions,
  "signal" | "monitor"
>;

/** Per-call options for {@link useTranslator} action methods. */
export type TranslateCallOptions = TranslatorTranslateOptions;

/**
 * Return value of {@link useTranslator}. Extends {@link BaseHookReturn} with the
 * Translator action methods.
 */
export interface TranslatorHookReturn extends BaseHookReturn {
  /**
   * Translates `input` and resolves with the full result.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  translate: (input: string, options?: TranslateCallOptions) => Promise<string>;
  /**
   * Streams the translation as it is produced. Concatenating all chunks yields
   * the same result as {@link translate}.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  translateStream: (
    input: string,
    options?: TranslateCallOptions,
  ) => AsyncIterable<string>;
  /**
   * Estimated usage of `input` against {@link TranslatorHookReturn.inputQuota}.
   *
   * @throws See {@link BaseHookReturn.prepare}.
   */
  measureInput: (
    input: string,
    options?: TranslateCallOptions,
  ) => Promise<number>;
  /** Maximum input the current instance accepts. `0` until `status` is `"ready"`. */
  inputQuota: number;
}

/**
 * React hook around the browser's [Translator API](https://developer.chrome.com/docs/ai/translator-api).
 * See {@link BaseHookReturn} for the lifecycle and gating rules.
 *
 * @example
 * ```tsx
 * function Translate({ text }: { text: string }) {
 *   const t = useTranslator({ sourceLanguage: "en", targetLanguage: "es" });
 *   return (
 *     <button
 *       disabled={t.status === "downloading"}
 *       onClick={async () => setOut(await t.translate(text))}
 *     >
 *       Translate
 *     </button>
 *   );
 * }
 * ```
 */
export function useTranslator(
  options: TranslatorOptions,
): TranslatorHookReturn {
  const { status, progress, error, prepare, inputQuota, acquire } =
    useLifecycle<TranslatorOptions, Translator>(
      "Translator",
      options,
      (instance) => instance.inputQuota,
    );

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
