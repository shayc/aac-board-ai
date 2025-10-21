import { useEffect, useRef, useState } from "react";

export type RewriterTone = "as-is" | "more-formal" | "more-casual";
export type RewriterFormat = "as-is" | "markdown" | "plain-text";
export type RewriterLength = "as-is" | "shorter" | "longer";

export interface RewriterOptions {
  tone?: RewriterTone;
  format?: RewriterFormat;
  length?: RewriterLength;
  sharedContext?: string;
}

export function useRewriter() {
  const isSupported = "Rewriter" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const rewriterRef = useRef<Rewriter | null>(null);

  async function createRewriter(
    options: RewriterOptions = {
      length: "shorter",
      tone: "as-is",
      format: "as-is",
    }
  ) {
    if (!isSupported) {
      return null;
    }

    if (rewriterRef.current) {
      return rewriterRef.current;
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

    rewriterRef.current = rewriter;
    return rewriter;
  }

  useEffect(() => {
    return () => {
      rewriterRef.current = null;
    };
  }, []);

  return {
    isSupported,
    downloadProgress,
    createRewriter,
  };
}
