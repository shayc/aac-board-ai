import { useEffect, useRef, useState } from "react";
import { useAICapabilities } from "./useAICapabilities";

export type WriterTone = "formal" | "neutral" | "casual";
export type WriterFormat = "markdown" | "plain-text";
export type WriterLength = "short" | "medium" | "long";

export interface WriterOptions {
  tone?: WriterTone;
  format?: WriterFormat;
  length?: WriterLength;
  sharedContext?: string;
  signal?: AbortSignal;
}

export function useWriter() {
  const { writer: isSupported } = useAICapabilities();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const writerRef = useRef<Writer | null>(null);
  const isReady = isSupported && downloadProgress === 1;

  async function createWriter(
    options: WriterOptions = {
      length: "short",
      tone: "neutral",
    }
  ) {
    if (!isSupported) {
      return null;
    }

    if (writerRef.current) {
      return writerRef.current;
    }

    const availability = await Writer.availability();
    if (availability === "unavailable") {
      return null;
    }

    const writer = await Writer.create({
      ...options,
      monitor(m) {
        m.addEventListener("downloadprogress", (event) => {
          setDownloadProgress(event.loaded);
        });
      },
    });

    writerRef.current = writer;
    return writer;
  }

  useEffect(() => {
    return () => {
      writerRef.current = null;
    };
  }, []);

  return {
    isSupported,
    isReady,
    downloadProgress,
    createWriter,
  };
}
