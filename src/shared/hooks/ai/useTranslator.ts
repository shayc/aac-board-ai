import { useEffect, useState } from "react";

export interface TranslatorOptions {
  /** BCP-47 code for the source language, e.g., 'en', 'es-419'. */
  sourceLanguage: string;
  /** BCP-47 code for the target language, e.g., 'fr'. */
  targetLanguage: string;
}

export function useTranslator(options: TranslatorOptions) {
  const isSupported = "Translator" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [translator, setTranslator] = useState<any>(null); // Adjust type as needed

  useEffect(() => {
    async function init() {
      const t = await create(options);
      setTranslator(t);
    }

    init();
  }, [options]);

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
          setDownloadProgress(event.loaded);
        });
      },
    });

    return translator;
  }

  return {
    isSupported,
    downloadProgress,
    translator,
  };
}
