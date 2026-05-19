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

export interface CreateTranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
  signal?: AbortSignal;
}

/**
 * Imperative `Translator` factory for call sites that decide the language pair
 * mid-flow and can't drive a hook. Mirrors the hook lifecycle: throws the same
 * `BuiltInAIError` subclasses (`Unsupported`, `Unavailable`, `NoUserActivation`)
 * the hooks throw, and progress flows through the same `useDownloadProgress` store.
 *
 * Result is `AsyncDisposable` — prefer `await using translator = await createTranslator(...)`.
 * `.destroy()` still works for callers releasing before scope exit.
 */
export async function createTranslator(
  options: CreateTranslatorOptions,
): Promise<Translator & AsyncDisposable> {
  if (!isSupported("Translator")) {
    throw new UnsupportedError("Built-in AI is not supported");
  }

  const { signal, ...createOptions } = options;
  const key = buildProgressKey("Translator", createOptions);

  const availability = await Translator.availability(createOptions);
  if (availability === "unavailable") {
    throw new UnavailableError("Built-in AI model is unavailable");
  }

  const willDownload = availability !== "available";
  if (willDownload && !hasUserActivation()) {
    throw new NoUserActivationError(
      "Built-in AI requires a user activation to download",
    );
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
    // Polyfill only when the runtime doesn't already implement disposal —
    // avoid clobbering a future native `[Symbol.asyncDispose]`.
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
