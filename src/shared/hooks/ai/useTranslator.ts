import { useState } from "react";

export interface TranslatorOptions {
  /** BCP-47 code for the source language, e.g., 'en', 'es-419'. */
  sourceLanguage: string;
  /** BCP-47 code for the target language, e.g., 'fr'. */
  targetLanguage: string;
}

/**
 * Hook for Chrome’s on-device Translator API.
 * Exposes support flag, model download progress, and a create() helper.
 */
export function useTranslator() {
  const isSupported = "Translator" in self;
  const [downloadProgress, setDownloadProgress] = useState(0); // 0..1

  async function create(options: TranslatorOptions) {
    if (!isSupported) {
      return null;
    }

    const availability = await Translator.availability({
      sourceLanguage: options.sourceLanguage,
      targetLanguage: options.targetLanguage,
    });

    if (availability === "unavailable") {
      return null;
    }

    const translator = await Translator.create({
      ...options,
      monitor(m) {
        m.addEventListener("downloadprogress", (event) => {
          setDownloadProgress(event.loaded ?? 0);
        });
      },
    });

    return translator;
  }

  return {
    isSupported,
    downloadProgress,
    create,
  };
}
