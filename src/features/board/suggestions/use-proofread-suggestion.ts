import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useProofreader } from "@shayc/react-built-in-ai";
import { enableQuietly } from "./enable-quietly";
import { isRequestFailure, type SuggestionSource } from "./suggestion-source";

export function useProofreadSuggestion(
  text: string,
  language: string,
): SuggestionSource {
  const proofreader = useProofreader({
    expectedInputLanguages: [language],
  });
  const hasText = text.trim().length > 0;

  const request = useLatestAsync({
    enabled: hasText && proofreader.status === "ready",
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
