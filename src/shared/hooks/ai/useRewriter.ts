import { useEffect, useRef, useState } from "react";

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
  const optionsRef = useRef<RewriterOptions | null>(null);

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

    if (
      rewriterRef.current &&
      optionsRef.current?.tone === options.tone &&
      optionsRef.current?.sharedContext === options.sharedContext
    ) {
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
    optionsRef.current = options;
    return rewriter;
  }

  useEffect(() => {
    return () => {
      rewriterRef.current = null;
      optionsRef.current = null;
    };
  }, []);

  return {
    isSupported,
    downloadProgress,
    createRewriter,
  };
}
