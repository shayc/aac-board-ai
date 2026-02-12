import { useAI } from "@shared/contexts/AIProvider/useAI";
import { normalizeLocaleCode } from "@shared/utils/language";
import { useRef } from "react";
import { aiCapabilities } from "./ai-capabilities";

export function useTranslator() {
  const { isTranslatorSupported } = aiCapabilities;
  const { setDownload } = useAI();
  const translatorRef = useRef<Translator | null>(null);

  async function createTranslator(options: TranslatorCreateOptions) {
    if (!isTranslatorSupported) {
      return null;
    }

    const sourceLanguage = normalizeLocaleCode(options.sourceLanguage ?? "en");
    const targetLanguage = normalizeLocaleCode(options.targetLanguage);

    if (
      translatorRef.current?.sourceLanguage === sourceLanguage &&
      translatorRef.current?.targetLanguage === targetLanguage
    ) {
      return translatorRef.current;
    }

    const availability = await Translator.availability({
      sourceLanguage,
      targetLanguage,
    });

    if (availability === "unavailable") {
      return null;
    }

    const translator = await Translator.create({
      sourceLanguage,
      targetLanguage,
      monitor(m) {
        m.addEventListener("downloadprogress", (event) => {
          setDownload("translator", event.loaded);
        });
      },
    });

    translatorRef.current = translator;
    return translator;
  }

  return {
    createTranslator,
  };
}
