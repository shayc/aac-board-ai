import { useEffect, useRef, useState } from "react";

export function useLanguageDetector() {
  const isSupported = "LanguageDetector" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const detectorRef = useRef<LanguageDetector | null>(null);

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
    downloadProgress,
    createLanguageDetector,
  };
}
