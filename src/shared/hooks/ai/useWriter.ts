import { useEffect, useState } from "react";

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

export function useWriter(options: WriterOptions) {
  const isSupported = "Writer" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [writer, setWriter] = useState<Writer | null>(null);

  useEffect(() => {
    async function init() {
      const w = await create(options);
      setWriter(w);
    }

    init();
  }, [options]);

  async function create(options: WriterOptions = {}) {
    if (!isSupported) {
      return null;
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

    return writer;
  }

  return {
    isSupported,
    downloadProgress,
    writer,
  };
}
