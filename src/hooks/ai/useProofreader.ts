import { useState } from "react";

type ProofreaderAvailability =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable";

export interface ProofreaderOptions {
  expectedInputLanguages?: string[];
}

export interface ProofreadCorrection {
  startIndex: number;
  endIndex: number;
}

export interface ProofreadResult {
  corrected: string;
  corrections: ProofreadCorrection[];
}

declare global {
  interface ProofreaderInstance {
    proofread(text: string): Promise<ProofreadResult>;
  }

  interface ProofreaderConstructor {
    availability(): Promise<ProofreaderAvailability>;
    create(
      options: ProofreaderOptions & {
        monitor?: (monitor: {
          addEventListener: (
            event: "downloadprogress",
            callback: (e: { loaded: number }) => void
          ) => void;
        }) => void;
      }
    ): Promise<ProofreaderInstance>;
  }

  const Proofreader: ProofreaderConstructor;
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
