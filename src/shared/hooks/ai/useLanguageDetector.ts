import { useEffect, useRef, useState } from "react";
import { getAICapabilities } from "./useAICapabilities";

export function useLanguageDetector() {
  const { isLanguageDetectorSupported } = getAICapabilities();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const detectorRef = useRef<LanguageDetector | null>(null);
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
          setDownloadProgress(event.loaded);
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
