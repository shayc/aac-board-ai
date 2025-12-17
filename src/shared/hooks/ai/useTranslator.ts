import { useEffect, useRef } from "react";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { getAICapabilities } from "./getAICapabilities";

export function useTranslator() {
  const { isTranslatorSupported } = getAICapabilities();
  const { downloads, setDownload } = useAI();
  const translatorRef = useRef<Translator | null>(null);
  const downloadProgress = downloads.translator ?? 0;
  const isReady = isTranslatorSupported && downloadProgress === 1;

  async function createTranslator(options: TranslatorCreateOptions) {
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
          setDownload("translator", event.loaded);
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
