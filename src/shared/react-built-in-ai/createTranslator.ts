import {
  buildProgressKey,
  clearDownloadProgress,
  setDownloadProgress,
} from "./internal/downloadProgress.ts";
import { isSupported } from "./namespaces.ts";

export interface CreateTranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
  signal?: AbortSignal;
}

/**
 * Imperative `Translator` factory for call sites that decide the language
 * pair mid-flow (e.g. after a cache check) and can't drive a hook. Awaits any
 * model download, reporting progress through the same store
 * [useDownloadProgress] subscribes to.
 *
 * Returns `null` when the namespace is missing or the model is
 * `"unavailable"`; other failures reject. Callers own `destroy()`.
 */
export async function createTranslator(
  options: CreateTranslatorOptions,
): Promise<Translator | null> {
  if (!isSupported("Translator")) {
    return null;
  }

  const { signal, ...createOptions } = options;
  const key = buildProgressKey("Translator", createOptions);

  if ((await Translator.availability(createOptions)) === "unavailable") {
    return null;
  }

  try {
    return await Translator.create({
      ...createOptions,
      signal,
      monitor: (monitor) =>
        monitor.addEventListener("downloadprogress", (event) => {
          setDownloadProgress(key, event.loaded);
        }),
    });
  } finally {
    clearDownloadProgress(key);
  }
}
