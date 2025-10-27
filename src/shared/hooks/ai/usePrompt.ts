import { useEffect, useRef, useState } from "react";

export interface UsePromptOptions {
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
}

export function usePrompt(words: string[] | undefined) {
  const isSupported = "LanguageModel" in self;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const sessionRef = useRef<LanguageModelSession | null>(null);

  async function createSession(
    options: UsePromptOptions = {
      temperature: 0.1,
      topK: 1,
    }
  ) {
    if (!isSupported) {
      return null;
    }

    // if (sessionRef.current) {
    //   return sessionRef.current;
    // }

    const modelParams = await LanguageModel.params();
    const availability = await LanguageModel.availability();

    if (availability === "unavailable") {
      return null;
    }

    const temperature = options.temperature ?? modelParams?.defaultTemperature;
    const topK = options.topK ?? modelParams?.defaultTopK;

    const initialPrompts: PromptMessage[] = [
      {
        role: "system",
        content: `
                ROLE
                Extend the user's utterance by appending one to four words.

                INSTRUCTIONS
                1) Repeat the user's utterance exactly (same casing, spacing, punctuation).
                2) After the echo, add one space, then append one to four words.
                3) The appended word(s) must be selected only from this list (lowercase exactly as shown):  
                  ${words?.join(", ") || ""}
                4) Choose the word(s) from the list that are **most semantically relevant** to the user’s utterance.
                5) Use no punctuation, no markdown, no emojis, no explanation, no extra text.
                6) If none of the allowed words fit meaningfully, append exactly: NO_WORDS

                OUTPUT FORMAT
                <original utterance><space><1-4 words from list or "NO_WORDS">
          `,
      },
    ];

    const session = await LanguageModel.create({
      topK,
      temperature,
      initialPrompts,
      signal: options.signal,
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
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
