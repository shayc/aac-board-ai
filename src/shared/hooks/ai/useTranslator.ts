import { useState } from "react";

export interface TranslatorOptions {
  /** BCP-47 code for the source language, e.g., 'en', 'es-419'. */
  sourceLanguage: string;
  /** BCP-47 code for the target language, e.g., 'fr'. */
  targetLanguage: string;
}

export function useTranslator() {
  const isSupported = "Translator" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);

  async function createTranslator(options: TranslatorOptions) {
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
          setDownloadProgress(event.loaded);
        });
      },
    });

    return translator;
  }

  return {
    isSupported,
    downloadProgress,
    createTranslator,
  };
}
