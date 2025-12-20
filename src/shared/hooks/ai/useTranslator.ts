import { useEffect, useRef } from "react";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { getAICapabilities } from "./getAICapabilities";

export function useTranslator() {
  const { isTranslatorSupported } = getAICapabilities();
  const { setDownload } = useAI();
  const translatorRef = useRef<Translator | null>(null);

  async function createTranslator(options: TranslatorCreateOptions) {
    if (!isTranslatorSupported) {
      return null;
    }

    if (
      translatorRef.current &&
      translatorRef.current.sourceLanguage === options.sourceLanguage &&
      translatorRef.current.targetLanguage === options.targetLanguage
    ) {
      return translatorRef.current;
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
    createTranslator,
  };
}
