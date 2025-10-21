import { useEffect, useRef, useState } from "react";

export interface UsePromptOptions {
  temperature?: number;
  topK?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
}

export function usePrompt() {
  const isSupported = "LanguageModel" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const sessionRef = useRef<LanguageModelSession | null>(null);

  async function createSession(options: UsePromptOptions = {}) {
    if (!isSupported) {
      return null;
    }

    if (sessionRef.current) {
      return sessionRef.current;
    }

    const modelParams = await LanguageModel.params();
    const availability = await LanguageModel.availability();

    if (availability === "unavailable") {
      return null;
    }

    const temperature = options.temperature ?? modelParams?.defaultTemperature;
    const topK = options.topK ?? modelParams?.defaultTopK;

    const session = await LanguageModel.create({
      temperature,
      topK,
      systemPrompt: options.systemPrompt,
      signal: options.signal,
      monitor(m) {
        m.addEventListener("downloadprogress", (event) => {
          setDownloadProgress(event.loaded);
        });
      },
    });

    sessionRef.current = session;
    return session;
  }

  useEffect(() => {
    return () => {
      sessionRef.current = null;
    };
  }, []);

  return {
    isSupported,
    downloadProgress,
    createSession,
  };
}
