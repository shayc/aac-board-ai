import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useRewriter } from "@shayc/react-built-in-ai";
import { type SuggestionSource, toSuggestionSource } from "./suggestion-source";

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

  const canRewrite = text !== "" && rewriter.status === "ready";
  const request = useLatestAsync({
    deps: [text, customInstructions, language],
    run: canRewrite
      ? (signal) => rewriter.rewrite(text, { signal })
      : undefined,
  });

  return toSuggestionSource(rewriter, request);
}
