import { useEffect, useRef, useState } from "react";

export function useProofreader() {
  const isSupported = "Proofreader" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const proofreaderRef = useRef<Proofreader | null>(null);

  async function createProofreader(
    options: ProofreaderCreateOptions = { expectedInputLanguages: ["en"] }
  ) {
    if (!isSupported) {
      return null;
    }

    if (proofreaderRef.current) {
      return proofreaderRef.current;
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

    proofreaderRef.current = proofreader;
    return proofreader;
  }

  useEffect(() => {
    return () => {
      proofreaderRef.current = null;
    };
  }, []);

  return {
    isSupported,
    downloadProgress,
    createProofreader,
  };
}
