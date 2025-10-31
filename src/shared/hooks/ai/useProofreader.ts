import { useEffect, useRef, useState } from "react";
import { getAICapabilities } from "./getAICapabilities";

export function useProofreader() {
  const { isProofreaderSupported } = getAICapabilities();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const proofreaderRef = useRef<Proofreader | null>(null);
  const isReady = isProofreaderSupported && downloadProgress === 1;

  async function createProofreader(
    options: ProofreaderCreateOptions = { expectedInputLanguages: ["en"] }
  ) {
    if (!isProofreaderSupported) {
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
    isProofreaderSupported,
    isReady,
    downloadProgress,
    createProofreader,
  };
}
