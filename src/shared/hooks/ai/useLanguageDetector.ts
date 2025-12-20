import { useRef } from "react";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { getAICapabilities } from "./getAICapabilities";

export function useLanguageDetector() {
  const { isLanguageDetectorSupported } = getAICapabilities();
  const { setDownload } = useAI();
  const detectorRef = useRef<LanguageDetector | null>(null);

  async function createLanguageDetector() {
    if (!isLanguageDetectorSupported) {
      return null;
    }

    if (detectorRef.current) {
      return detectorRef.current;
    }

    const availability = await LanguageDetector.availability();
    if (availability === "unavailable") {
      return null;
    }

    const languageDetector = await LanguageDetector.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (event) => {
          setDownload("languageDetector", event.loaded);
        });
      },
    });

    detectorRef.current = languageDetector;
    return languageDetector;
  }

  return {
    createLanguageDetector,
  };
}
