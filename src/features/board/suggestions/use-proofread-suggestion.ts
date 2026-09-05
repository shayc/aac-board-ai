import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useProofreader } from "@shayc/react-built-in-ai";
import { proofreaderLanguageOptions } from "./engine-language-options";
import { prepareQuietly } from "./prepare-quietly";
import { isRequestFailure, type SuggestionSource } from "./suggestion-source";

export function useProofreadSuggestion(
  text: string,
  language: string,
  revision: number,
): SuggestionSource {
  const proofreader = useProofreader(proofreaderLanguageOptions(language));
  const hasText = text.trim().length > 0;

  const request = useLatestAsync({
    enabled: hasText && proofreader.status === "ready",
    deps: [text, language, revision],
    run: (signal) =>
      proofreader
        .proofread(text, { signal })
        .then((result) => result.correctedInput),
  });

  const prepare = () => {
    if (proofreader.status === "downloadable") {
      prepareQuietly(proofreader);
    }
  };

  return {
    engineStatus: proofreader.status,
    candidate: request.value,
    isRequestPending: request.isPending,
    hasRequestFailed: isRequestFailure(request.error),
    prepare,
  };
}
