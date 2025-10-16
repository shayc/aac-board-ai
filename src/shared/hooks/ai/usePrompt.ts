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
  const [params, setParams] = useState<LanguageModelParams | null>(null);

  useEffect(() => {
    async function init() {
      if (!isSupported) {
        return;
      }

      const modelParams = await LanguageModel.params();
      setParams(modelParams);

      const newSession = await createSession(options, modelParams);
      setSession(newSession);
    }

    init();

    return () => {
      if (session) {
        session.destroy();
      }
    };
  }, [options.temperature, options.topK, options.systemPrompt]);

  async function createSession(
    opts: UsePromptOptions,
    modelParams: LanguageModelParams
  ) {
    if (!isSupported) {
      return null;
    }

    const availability = await LanguageModel.availability();
    if (availability === "unavailable") {
      return null;
    }

    const temperature =
      opts.temperature ?? modelParams?.defaultTemperature ?? 1;
    const topK = opts.topK ?? modelParams?.defaultTopK ?? 3;

    const session = await LanguageModel.create({
      temperature,
      topK,
      systemPrompt: opts.systemPrompt,
      signal: opts.signal,
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
    params,
  };
}
