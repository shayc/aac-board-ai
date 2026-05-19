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
 * mid-flow and can't drive a hook. Returns `null` when unsupported or
 * unavailable; other failures reject. Progress flows through the
 * `useDownloadProgress` store.
 *
 * Result is `AsyncDisposable` — prefer `await using translator = await createTranslator(...)`.
 * `.destroy()` still works for callers releasing before scope exit.
 */
export async function createTranslator(
  options: CreateTranslatorOptions,
): Promise<(Translator & AsyncDisposable) | null> {
  if (!isSupported("Translator")) {
    return null;
  }

  const { signal, ...createOptions } = options;
  const key = buildProgressKey("Translator", createOptions);

  if ((await Translator.availability(createOptions)) === "unavailable") {
    return null;
  }

  try {
    const instance = await Translator.create({
      ...createOptions,
      signal,
      monitor: (monitor) =>
        monitor.addEventListener("downloadprogress", (event) => {
          setDownloadProgress(key, event.loaded);
        }),
    });
    Object.defineProperty(instance, Symbol.asyncDispose, {
      value: () => {
        instance.destroy();
        return Promise.resolve();
      },
    });
    return instance as Translator & AsyncDisposable;
  } finally {
    clearDownloadProgress(key);
  }
}
