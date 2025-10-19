import { useState } from "react";

export function useLanguageDetector() {
  const isSupported = "LanguageDetector" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);

  async function createLanguageDetector() {
    if (!isSupported) {
      return null;
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

    return languageDetector;
  }

  return {
    isSupported,
    downloadProgress,
    createLanguageDetector,
  };
}
