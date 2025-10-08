import { useState } from "react";

export interface RewriterOptions {
  tone?: "more-formal" | "as-is" | "more-casual";
  format?: "as-is" | "markdown" | "plain-text";
  length?: "shorter" | "as-is" | "longer";
  sharedContext?: string;
}

export function useRewriter() {
  const isSupported = "Rewriter" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);

  async function create(options: RewriterOptions = {}) {
    if (!isSupported) {
      return null;
    }

    const available = await Rewriter.availability();
    if (available === "unavailable") {
      return null;
    }

    const rewriter = await Rewriter.create({
      ...options,
      monitor(m) {
        m.addEventListener("downloadprogress", (error: any) => {
          setDownloadProgress(error.loaded);
        });
      },
    });

    return rewriter;
  }

  return { isSupported, create, downloadProgress };
}
