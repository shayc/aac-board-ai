import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useRewriter } from "@shayc/react-built-in-ai";
import {
  enableQuietly,
  isRequestFailure,
  type SuggestionSource,
} from "./suggestion-source";

interface UseRewriterSourceOptions {
  text: string;
  customInstructions: string;
  language: string;
  tone: "as-is" | "more-casual";
}

export function useRewriterSource({
  text,
  customInstructions,
  language,
  tone,
}: UseRewriterSourceOptions): SuggestionSource {
  const rewriter = useRewriter({
    sharedContext: customInstructions,
    length: "shorter",
    format: "plain-text",
    tone,
    expectedInputLanguages: [language],
    expectedContextLanguages: [language],
    outputLanguage: language,
  });

  const request = useLatestAsync({
    enabled: text !== "" && rewriter.status === "ready",
    deps: [text, customInstructions, language],
    run: (signal) => rewriter.rewrite(text, { signal }),
  });

  function enable() {
    if (rewriter.status === "downloadable") {
      enableQuietly(rewriter);
    }
  }

  return {
    engineStatus: rewriter.status,
    candidate: request.value,
    isRequestPending: request.isPending,
    hasRequestFailed: isRequestFailure(request.error),
    enable,
  };
}
