import { createInstance } from "../internal/lifecycle/create-instance.ts";

/**
 * Options for {@link createTranslator}.
 */
export interface CreateTranslatorOptions {
  /** BCP-47 language tag of the source text (e.g. `"en"`, `"fr"`). */
  sourceLanguage: string;
  /** BCP-47 language tag of the target text (e.g. `"es"`, `"ja"`). */
  targetLanguage: string;
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
  const instance = await createInstance<typeof createOptions, Translator>({
    name: "Translator",
    options: createOptions,
    signal,
  });
  const disposable = instance as Translator & Partial<AsyncDisposable>;
  disposable[Symbol.asyncDispose] ??= () =>
    Promise.resolve(disposable.destroy());
  return disposable as Translator & AsyncDisposable;
}
