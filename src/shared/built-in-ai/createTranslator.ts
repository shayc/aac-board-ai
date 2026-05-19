import {
  NoUserActivationError,
  UnavailableError,
  UnsupportedError,
} from "./errors.ts";
import { hasUserActivation } from "./internal/activation.ts";
import {
  buildProgressKey,
  clearDownloadProgress,
  setDownloadProgress,
} from "./internal/progress-store.ts";
import { isSupported } from "./namespaces.ts";

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
 * - Throws {@link UnsupportedError} when the `Translator` namespace is missing.
 * - Throws {@link UnavailableError} when `availability()` reports `"unavailable"`.
 * - Throws {@link NoUserActivationError} when a download is required without a
 *   transient user activation. Call from a click or keypress handler, or
 *   pre-warm the model via {@link useTranslator}.
 * - Reports download progress through the same store {@link useDownloadProgress}
 *   reads from, so a hook elsewhere in the tree can render a global indicator.
 *
 * The result is `AsyncDisposable`: prefer `await using` so the instance is
 * released when scope exits. `.destroy()` is still exposed for callers that
 * need to release the model earlier.
 *
 * @param options - Language pair and an optional `AbortSignal`.
 * @returns A `Translator` instance with `Symbol.asyncDispose` attached.
 * @throws {UnsupportedError} The `Translator` namespace is undefined.
 * @throws {UnavailableError} The model cannot run on this device.
 * @throws {NoUserActivationError} A download is required without a user activation.
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
  if (!isSupported("Translator")) {
    throw new UnsupportedError();
  }

  const { signal, ...createOptions } = options;
  const key = buildProgressKey("Translator", createOptions);

  const availability = await Translator.availability(createOptions);
  if (availability === "unavailable") {
    throw new UnavailableError();
  }

  const willDownload = availability !== "available";
  if (willDownload && !hasUserActivation()) {
    throw new NoUserActivationError();
  }

  if (willDownload) {
    setDownloadProgress(key, 0);
  }

  try {
    const instance = await Translator.create({
      ...createOptions,
      signal,
      monitor: willDownload
        ? (monitor) =>
            monitor.addEventListener("downloadprogress", (event) => {
              setDownloadProgress(key, event.loaded);
            })
        : undefined,
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
  } finally {
    if (willDownload) {
      clearDownloadProgress(key);
    }
  }
}
