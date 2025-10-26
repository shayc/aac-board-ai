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
    console.log("usePrompt words", words);

    // TODO: fix any
    const session = ((await LanguageModel.create) as any)({
      temperature,
      topK,
      initialPrompts: [
        {
          role: "system",
          content: `
            ROLE
You extend the user’s utterance by appending exactly one or two words.

RULES:
1) Echo the user’s utterance **exactly**, maintaining original casing, spacing, punctuation.
2) Immediately after the echo, append a single space, then exactly one to three words.
3) The appended word(s) must be selected **only** from this list (lowercase exactly as shown):  
   ${words?.join(", ") || ""}
4) Use no markdown, no punctuation, no emojis, no explanation, no additional text.
5) If none of the allowed words fit to make semantic sense, append the word “none”.
6) Prioritize telegraphic meaning (short phrases) over full grammar.

OUTPUT FORMAT:
<original utterance><space><one-or-two-words-from-list-or-"none">

EXAMPLES
User: i want  
Assistant: i want apple

User: fix my  
Assistant: fix my laptop

User: paint car  
Assistant: paint car blue

User: weather today  
Assistant: weather today none
          `,
        },
      ],
      signal: options.signal,
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }] as any,
      monitor(m: any) {
        m.addEventListener("downloadprogress", (event: any) => {
          setDownloadProgress(event.loaded);
        });
      },
    });
    console.log("created prompt session", session);
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
