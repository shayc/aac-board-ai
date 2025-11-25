import { useEffect, useRef, useState } from "react";
import { getAICapabilities } from "./getAICapabilities";

export function useWriter() {
  const { isWriterSupported } = getAICapabilities();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const writerRef = useRef<Writer | null>(null);
  const isReady = isWriterSupported && downloadProgress === 1;

  async function createWriter(
    options: WriterCreateOptions = {
      length: "short",
      tone: "neutral",
    },
  ) {
    if (!isWriterSupported) {
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
    isWriterSupported,
    isReady,
    downloadProgress,
    createWriter,
  };
}
