import { useEffect, useState } from "react";

export type RewriterTone = "as-is" | "more-formal" | "more-casual";
export type RewriterFormat = "as-is" | "markdown" | "plain-text";
export type RewriterLength = "as-is" | "shorter" | "longer";

export interface RewriterOptions {
  tone?: RewriterTone;
  format?: RewriterFormat;
  length?: RewriterLength;
  sharedContext?: string;
}

export function useRewriter(options: RewriterOptions) {
  const isSupported = "Rewriter" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [rewriter, setRewriter] = useState<any>(null); // Adjust type as needed

  useEffect(() => {
    async function initialize() {
      const instance = await create(options);
      console.log("Rewriter tone:", options.tone);
      setRewriter(instance);
    }

    initialize();
  }, [options]);

  async function create(options: RewriterOptions) {
    if (!isSupported) {
      return null;
    }

    const availability = await Rewriter.availability();
    if (availability === "unavailable") {
      return null;
    }

    const rewriter = await Rewriter.create({
      ...options,
      monitor(m) {
        m.addEventListener("downloadprogress", (event) => {
          setDownloadProgress(event.loaded);
        });
      },
    });

    return rewriter;
  }

  return {
    isSupported,
    downloadProgress,
    rewriter,
  };
}
