import { useState } from "react";

export interface ProofreaderOptions {
  expectedInputLanguages?: string[];
}

export function useProofreader() {
  const isSupported = "Proofreader" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);

  async function create(
    options: ProofreaderOptions = {
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
    create,
  };
}
