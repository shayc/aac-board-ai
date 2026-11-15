import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { type Status, useLanguageModel } from "@shayc/react-built-in-ai";
import { nextWordLanguageOptions } from "./next-word-prompt";
import { predictNextWords } from "./next-word-session";

interface UseNextWordSourceOptions {
  text: string;
  vocabulary: readonly string[];
  language: string;
}

export interface NextWordSource {
  engineStatus: Status;
  words: readonly string[];
  isRequestPending: boolean;
  hasRequestFailed: boolean;
  enable: () => void;
}

export function useNextWordSource({
  text,
  vocabulary,
  language,
}: UseNextWordSourceOptions): NextWordSource {
  // The hook's own session only tracks availability, download and enabling;
  // predictions run on a per-board session that supports cloning.
  const engine = useLanguageModel(nextWordLanguageOptions(language));

  const canPredict =
    text !== "" && vocabulary.length > 0 && engine.status === "ready";
  const request = useLatestAsync({
    deps: [text, language, ...vocabulary],
    run: canPredict
      ? (signal) => predictNextWords({ text, vocabulary, language, signal })
      : undefined,
  });

  function enable() {
    // Engine status exposes preparation failures to the UI.
    void engine.prepare().catch(() => undefined);
  }

  return {
    engineStatus: engine.status,
    words: request.value ?? [],
    isRequestPending: request.isPending,
    hasRequestFailed:
      request.error !== undefined && request.error.name !== "AbortError",
    enable,
  };
}
