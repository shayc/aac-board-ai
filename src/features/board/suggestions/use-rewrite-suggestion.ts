import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useRewriter } from "@shayc/react-built-in-ai";
import { rewriterLanguageOptions } from "./engine-language-options";
import { prepareQuietly } from "./prepare-quietly";
import { isRequestFailure, type SuggestionSource } from "./suggestion-source";

interface RewriteSuggestionOptions {
  text: string;
  revision: number;
  customInstructions: string;
  language: string;
  tone: "as-is" | "more-casual";
}

export function useRewriteSuggestion({
  text,
  revision,
  customInstructions,
  language,
  tone,
}: RewriteSuggestionOptions): SuggestionSource {
  const rewriter = useRewriter({
    sharedContext: customInstructions,
    length: "shorter",
    format: "plain-text",
    tone,
    ...rewriterLanguageOptions(language),
  });
  const hasText = text.trim().length > 0;

  const request = useLatestAsync({
    enabled: hasText && rewriter.status === "ready",
    deps: [text, customInstructions, language, revision],
    run: (signal) => rewriter.rewrite(text, { signal }),
  });

  const prepare = () => {
    if (rewriter.status === "downloadable") {
      prepareQuietly(rewriter);
    }
  };

  return {
    engineStatus: rewriter.status,
    candidate: request.value,
    isRequestPending: request.isPending,
    hasRequestFailed: isRequestFailure(request.error),
    prepare,
  };
}
