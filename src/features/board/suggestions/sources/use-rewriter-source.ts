import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useRewriter } from "@shayc/react-built-in-ai";
import { type SuggestionSource, toSuggestionSource } from "./suggestion-source";
import { rewriterLanguageOptions } from "./suggestion-support";

const SUGGESTION_CONTEXT =
  "The text is words an AAC user tapped to say something. Rewrite it as the one short, natural sentence they mean to say. Keep their meaning, their words where possible, and who it is about. Do not answer it or add ideas.";

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
  const sharedContext = suggestionContext(customInstructions);
  const rewriter = useRewriter({
    sharedContext,
    length: "shorter",
    format: "plain-text",
    tone,
    ...rewriterLanguageOptions(language),
  });

  const canRewrite = text !== "" && rewriter.status === "ready";
  const request = useLatestAsync({
    deps: [text, sharedContext, language],
    run: canRewrite
      ? (signal) => rewriter.rewrite(text, { signal })
      : undefined,
  });

  return toSuggestionSource(rewriter, request);
}

function suggestionContext(customInstructions: string): string {
  const instructions = customInstructions.trim();

  return instructions === ""
    ? SUGGESTION_CONTEXT
    : `${SUGGESTION_CONTEXT}\n${instructions}`;
}
