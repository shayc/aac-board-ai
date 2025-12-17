import { useEffect, useRef } from "react";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { getAICapabilities } from "./getAICapabilities";

export function useLanguageDetector() {
  const { isLanguageDetectorSupported } = getAICapabilities();
  const { downloads, setDownload } = useAI();
  const detectorRef = useRef<LanguageDetector | null>(null);
  const downloadProgress = downloads.languageDetector ?? 0;
  const isReady = isLanguageDetectorSupported && downloadProgress === 1;

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

  useEffect(() => {
    return () => {
      detectorRef.current = null;
    };
  }, []);

  return {
    isLanguageDetectorSupported,
    isReady,
    downloadProgress,
    createLanguageDetector,
  };
}
