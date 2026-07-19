import { rewriterLanguageOptions } from "@shared/built-in-ai/engine-language-options";
import { prepareQuietly } from "@shared/built-in-ai/prepare-quietly";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useRewriter } from "@shayc/react-built-in-ai";
import { isRequestFailure, type SuggestionSource } from "./suggestion-source";

interface RewriteSuggestionOptions {
  text: string;
  sharedContext: string;
  language: string;
  tone: "as-is" | "more-casual";
}

export function useRewriteSuggestion({
  text,
  sharedContext,
  language,
  tone,
}: RewriteSuggestionOptions): SuggestionSource {
  const rewriter = useRewriter({
    sharedContext,
    length: "shorter",
    format: "plain-text",
    tone,
    ...rewriterLanguageOptions(language),
  });
  const hasText = text.trim().length > 0;

  const request = useLatestAsync({
    enabled: hasText && rewriter.status === "ready",
    deps: [text, sharedContext, language],
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
