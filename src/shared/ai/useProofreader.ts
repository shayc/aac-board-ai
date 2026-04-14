import { useRef } from "react";
import { isProofreaderSupported } from "./ai-capabilities";
import { useAI } from "./useAI";

export function useProofreader() {
  const { setDownload } = useAI();
  const proofreaderRef = useRef<Proofreader | null>(null);

  async function createProofreader(
    options: ProofreaderCreateOptions = { expectedInputLanguages: ["en"] },
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
          setDownload("proofreader", event.loaded);
        });
      },
    });

    proofreaderRef.current = proofreader;
    return proofreader;
  }

  return {
    createProofreader,
  };
}
