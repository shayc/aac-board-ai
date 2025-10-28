import { useEffect, useRef, useState } from "react";
import { useAICapabilities } from "./useAICapabilities";

export function useLanguageDetector() {
  const { languageDetector: isSupported } = useAICapabilities();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const detectorRef = useRef<LanguageDetector | null>(null);
  const isReady = isSupported && downloadProgress === 1;

  async function createLanguageDetector() {
    if (!isSupported) {
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
    isSupported,
    isReady,
    downloadProgress,
    createLanguageDetector,
  };
}
