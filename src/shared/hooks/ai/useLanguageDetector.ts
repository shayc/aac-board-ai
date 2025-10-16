import { useEffect, useState } from "react";

export function useLanguageDetector() {
  const isSupported = "LanguageDetector" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [languageDetector, setLanguageDetector] = useState<any>(null); // Adjust type as needed

  useEffect(() => {
    async function init() {
      const ld = await create();
      setLanguageDetector(ld);
    }

    init();
  }, []);

  async function create() {
    if (!isSupported) {
      return null;
    }

    const availability = await LanguageDetector.availability();
    if (availability === "unavailable") {
      return null;
    }

    const detector = await LanguageDetector.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (event) => {
          setDownloadProgress(event.loaded);
        });
      },
    });

    return detector;
  }

  return {
    isSupported,
    downloadProgress,
    languageDetector,
  };
}
