import { useRef } from "react";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { getAICapabilities } from "./getAICapabilities";

export function useWriter() {
  const { isWriterSupported } = getAICapabilities();
  const { setDownload } = useAI();
  const writerRef = useRef<Writer | null>(null);

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
          setDownload("writer", event.loaded);
        });
      },
    });

    writerRef.current = writer;
    return writer;
  }

  return {
    createWriter,
  };
}
