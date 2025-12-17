import { useEffect, useRef } from "react";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { getAICapabilities } from "./getAICapabilities";

export function useRewriter() {
  const { isRewriterSupported } = getAICapabilities();
  const { downloads, setDownload } = useAI();
  const rewriterRef = useRef<Rewriter | null>(null);
  const optionsRef = useRef<RewriterCreateOptions | null>(null);
  const downloadProgress = downloads.rewriter ?? 0;
  const isReady = isRewriterSupported && downloadProgress === 1;

  async function createRewriter(
    options: RewriterCreateOptions = {
      length: "shorter",
      tone: "as-is",
      format: "as-is",
    },
  ) {
    if (!isRewriterSupported) {
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
          setDownload("rewriter", event.loaded);
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
    isRewriterSupported,
    isReady,
    downloadProgress,
    createRewriter,
  };
}
