import { useEffect, useState } from "react";

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

export function usePrompt(options: UsePromptOptions = {}) {
  const isSupported = "LanguageModel" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [session, setSession] = useState<LanguageModelSession | null>(null);

  useEffect(() => {
    async function init() {
      if (!isSupported) {
        return;
      }

      const newSession = await createSession(options);
      setSession(newSession);
    }

    init();

    return () => {
      if (session) {
        session.destroy();
      }
    };
  }, [options.temperature, options.topK, options.systemPrompt]);

  async function createSession(opts: UsePromptOptions) {
    if (!isSupported) {
      return null;
    }

    const modelParams = await LanguageModel.params();

    const availability = await LanguageModel.availability();
    if (availability === "unavailable") {
      return null;
    }

    const temperature = opts.temperature ?? modelParams?.defaultTemperature;
    const topK = opts.topK ?? modelParams?.defaultTopK;

    const session = await LanguageModel.create({
      temperature,
      topK,
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
    session,
  };
}
