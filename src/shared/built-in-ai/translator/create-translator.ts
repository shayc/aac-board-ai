import { createInstance } from "../internal/lifecycle/create-instance.ts";
import type { TranslatorOptions } from "./use-translator.ts";

/**
 * Options for {@link createTranslator}. Mirrors {@link TranslatorOptions} plus
 * an optional cancellation signal.
 */
export interface CreateTranslatorOptions extends TranslatorOptions {
  /** Cancels both the (optional) download and `Translator.create()` call. */
  signal?: AbortSignal;
}

/**
 * Imperative `Translator` factory. Mirrors the {@link useTranslator} lifecycle
 * for call sites that decide the language pair mid-flow and can't render a
 * hook (queued translations, command palettes, one-shot scripts).
 *
 * Throws {@link UnsupportedError}, {@link UnavailableError}, or
 * {@link NoUserActivationError} — call from a user-activation handler when a
 * download may be required, or pre-warm via {@link useTranslator}. The returned
 * instance is `AsyncDisposable`; prefer `await using` to release on scope exit.
 *
 * @example
 * ```ts
 * await using translator = await createTranslator({
 *   sourceLanguage: "en",
 *   targetLanguage: "es",
 *   signal,
 * });
 * return await translator.translate(text);
 * ```
 */
export async function createTranslator(
  options: CreateTranslatorOptions,
): Promise<Translator & AsyncDisposable> {
  const { signal, ...createOptions } = options;
  return createInstance<typeof createOptions, Translator>({
    name: "Translator",
    options: createOptions,
    signal,
  });
}
