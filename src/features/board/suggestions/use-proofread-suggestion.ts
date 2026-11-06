import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useProofreader } from "@shayc/react-built-in-ai";
import { enableQuietly } from "./enable-quietly";
import { isRequestFailure, type SuggestionSource } from "./suggestion-source";

interface UseProofreadSuggestionOptions {
  text: string;
  language: string;
}

export function useProofreadSuggestion({
  text,
  language,
}: UseProofreadSuggestionOptions): SuggestionSource {
  const proofreader = useProofreader({
    expectedInputLanguages: [language],
  });

  const request = useLatestAsync({
    enabled: text !== "" && proofreader.status === "ready",
    deps: [text, language],
    run: (signal) =>
      proofreader
        .proofread(text, { signal })
        .then((result) => result.correctedInput),
  });

  const enable = () => {
    if (proofreader.status === "downloadable") {
      enableQuietly(proofreader);
    }
  };

  return {
    engineStatus: proofreader.status,
    candidate: request.value,
    isRequestPending: request.isPending,
    hasRequestFailed: isRequestFailure(request.error),
    enable,
  };
}
