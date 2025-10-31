import { useEffect, useRef, useState } from "react";
import { useAICapabilities } from "./useAICapabilities";

export interface TranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

export function useTranslator() {
  const { isTranslatorSupported } = useAICapabilities();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const translatorRef = useRef<Translator | null>(null);
  const isReady = isTranslatorSupported && downloadProgress === 1;

  async function createTranslator(options: TranslatorOptions) {
    if (!isTranslatorSupported) {
      return null;
    }

    const availability = await Translator.availability({
      sourceLanguage: options.sourceLanguage ?? "en",
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

    translatorRef.current = translator;
    return translator;
  }

  useEffect(() => {
    return () => {
      translatorRef.current = null;
    };
  }, []);

  return {
    isTranslatorSupported,
    isReady,
    downloadProgress,
    createTranslator,
  };
}
