import { useState } from "react";

export function useProofreader() {
  const isSupported = "Proofreader" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);

  async function create(
    options: ProofreaderCreateOptions = {
      expectedInputLanguages: ["en"],
    }
  ) {
    if (!isSupported) {
      return null;
    }

    const availability = await Proofreader.availability();
    if (availability === "unavailable") {
      return null;
    }

    const proofreader = await Proofreader.create({
      ...options,
      monitor(m) {
        m.addEventListener("downloadprogress", (event) => {
          setDownloadProgress(event.loaded);
        });
      },
    });

    return proofreader;
  }

  return {
    isSupported,
    downloadProgress,
    createProofreader: create,
  };
}
