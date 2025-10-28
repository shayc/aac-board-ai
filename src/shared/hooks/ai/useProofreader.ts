import { useEffect, useRef, useState } from "react";
import { useAICapabilities } from "./useAICapabilities";

export function useProofreader() {
  const { proofreader: isSupported } = useAICapabilities();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const proofreaderRef = useRef<Proofreader | null>(null);
  const isReady = isSupported && downloadProgress === 1;

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
    isReady,
    downloadProgress,
    createProofreader,
  };
}
