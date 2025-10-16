import { useEffect, useState } from "react";

export interface ProofreaderOptions {
  expectedInputLanguages?: string[];
}

export function useProofreader({ expectedInputLanguages }: ProofreaderOptions) {
  const isSupported = "Proofreader" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [proofreader, setProofreader] = useState<any>(null); // Adjust type as needed

  useEffect(() => {
    async function init() {
      const pr = await create({
        expectedInputLanguages,
      });

      setProofreader(pr);
    }

    init();
  }, [expectedInputLanguages]);

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
    proofreader,
  };
}
