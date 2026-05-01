import { useRef } from "react";
import { isRewriterSupported } from "./capabilities";
import { useAI } from "./useAI";

export function useRewriter() {
  const { setDownload } = useAI();
  const rewriterRef = useRef<Rewriter | null>(null);
  const optionsRef = useRef<RewriterCreateOptions | null>(null);

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
      optionsRef.current &&
      isSameOptions(optionsRef.current, options)
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

  return {
    createRewriter,
  };
}

function isSameOptions(
  previous: RewriterCreateOptions,
  next: RewriterCreateOptions,
): boolean {
  return (
    previous.tone === next.tone &&
    previous.format === next.format &&
    previous.length === next.length &&
    previous.sharedContext === next.sharedContext
  );
}
