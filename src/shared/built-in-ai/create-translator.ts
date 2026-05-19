import { createInstance } from "./internal/create-instance.ts";

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
 * Imperative `Translator` factory for call sites that decide the language pair
 * mid-flow and can't drive a hook (e.g. queued translations, command palettes,
 * one-shot scripts).
 *
 * Mirrors the hook lifecycle exactly:
 *
 * - Throws `UnsupportedError` when the `Translator` namespace is missing.
 * - Throws `UnavailableError` when `availability()` reports `"unavailable"`.
 * - Throws `NoUserActivationError` when a download is required without a
 *   transient user activation. Call from a click or keypress handler, or
 *   pre-warm the model via `useTranslator`.
 * - Reports download progress through the same store `useDownloadProgress`
 *   reads from, so a hook elsewhere in the tree can render a global indicator.
 *
 * The result is `AsyncDisposable`: prefer `await using` so the instance is
 * released when scope exits. `.destroy()` is still exposed for callers that
 * need to release the model earlier.
 *
 * @param options - Language pair and an optional `AbortSignal`.
 * @returns A `Translator` instance with `Symbol.asyncDispose` attached.
 *
 * @example
 * ```ts
 * async function translate(text: string, signal: AbortSignal) {
 *   try {
 *     await using translator = await createTranslator({
 *       sourceLanguage: "en",
 *       targetLanguage: "es",
 *       signal,
 *     });
 *     return await translator.translate(text);
 *   } catch (error) {
 *     if (error instanceof BuiltInAIError) {
 *       // Unsupported / unavailable / no-activation — render a fallback.
 *       return null;
 *     }
 *     throw error;
 *   }
 * }
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
  if (
    typeof (instance as Partial<AsyncDisposable>)[Symbol.asyncDispose] !==
    "function"
  ) {
    Object.defineProperty(instance, Symbol.asyncDispose, {
      value: () => {
        instance.destroy();
        return Promise.resolve();
      },
    });
  }
  return instance as Translator & AsyncDisposable;
}
