import { useState } from "react";

type RewriterAvailability =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable";

type RewriterTone = "more-formal" | "as-is" | "more-casual";
type RewriterFormat = "as-is" | "markdown" | "plain-text";
type RewriterLength = "shorter" | "as-is" | "longer";

export interface RewriterOptions {
  tone?: RewriterTone;
  format?: RewriterFormat;
  length?: RewriterLength;
  sharedContext?: string;
}

interface RewriterRewriteOptions {
  context?: string;
  tone?: RewriterTone;
  signal?: AbortSignal;
}

declare global {
  interface RewriterInstance {
    rewrite(input: string, options?: RewriterRewriteOptions): Promise<string>;
    rewriteStreaming?(
      input: string,
      options?: RewriterRewriteOptions
    ): AsyncIterable<string>;
    addEventListener?(
      type: "downloadprogress",
      listener: (e: { loaded: number; total?: number }) => void
    ): void;
    destroy?(): void;
  }

  interface RewriterConstructor {
    availability(): Promise<RewriterAvailability>;
    create(
      options?: RewriterOptions & {
        monitor?: (monitor: {
          addEventListener: (
            event: "downloadprogress",
            callback: (e: { loaded: number }) => void
          ) => void;
        }) => void;
        signal?: AbortSignal;
      }
    ): Promise<RewriterInstance>;
  }

  const Rewriter: RewriterConstructor;
}

export function useRewriter() {
  const isSupported = "Rewriter" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);

  async function create(options: RewriterOptions = {}) {
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
    create,
  };
}
