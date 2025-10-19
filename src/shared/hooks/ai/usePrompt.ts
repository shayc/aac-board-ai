import { useState } from "react";

export interface UsePromptOptions {
  /** Temperature parameter for response randomness (0-2). */
  temperature?: number;
  /** Top-K parameter for response diversity. */
  topK?: number;
  /** System prompt to set context for the session. */
  systemPrompt?: string;
  /** Abort signal to cancel session creation. */
  signal?: AbortSignal;
}

export function usePrompt() {
  const isSupported = "LanguageModel" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);

  async function createSession(options: UsePromptOptions = {}) {
    if (!isSupported) {
      return null;
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

    return session;
  }

  return {
    isSupported,
    downloadProgress,
    createSession,
  };
}
