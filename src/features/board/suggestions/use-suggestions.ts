import { useAISharedContext } from "@shared/hooks/use-ai-shared-context";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLanguage } from "@shared/language/use-language";
import { useProofreader, useRewriter } from "@shayc/react-built-in-ai";
import { useState } from "react";
import { toPhrases } from "./to-phrases";
import type { SuggestionTone } from "./types";
import { useFreshResult } from "./use-fresh-result";

const SHARED_CONTEXT_DEBOUNCE_MS = 400;

export interface UseSuggestionsReturn {
  isSupported: boolean;
  isProofreaderSupported: boolean;
  isRewriterSupported: boolean;
  phrases: string[];
  tone: SuggestionTone;
  setTone: (tone: SuggestionTone) => void;
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const sharedContext = useAISharedContext();
  const debouncedSharedContext = useDebouncedValue(
    sharedContext,
    SHARED_CONTEXT_DEBOUNCE_MS,
  );
  const [tone, setTone] = useState<SuggestionTone>("as-is");
  const { language } = useLanguage();

  const proofreader = useProofreader({
    expectedInputLanguages: [language],
  });
  const rewriter = useRewriter({
    tone,
    sharedContext: debouncedSharedContext,
    length: "shorter",
    format: "plain-text",
    expectedInputLanguages: [language],
    expectedContextLanguages: [language],
    outputLanguage: language,
  });

  const isProofreaderSupported = proofreader.status !== "unsupported";
  const isRewriterSupported = rewriter.status !== "unsupported";

  const hasText = text.trim().length > 0;

  const corrected = useFreshResult({
    enabled: hasText && proofreader.status === "ready",
    deps: [text, language],
    fetch: (signal) =>
      proofreader
        .proofread(text, { signal })
        .then((result) => result.correctedInput)
        .catch(() => undefined),
  });

  const rewritten = useFreshResult({
    enabled: hasText && rewriter.status === "ready",
    deps: [text, tone, debouncedSharedContext, language],
    fetch: (signal) =>
      rewriter.rewrite(text, { signal }).catch(() => undefined),
  });

  return {
    isSupported: isProofreaderSupported || isRewriterSupported,
    isProofreaderSupported,
    isRewriterSupported,
    phrases: toPhrases(text, [corrected, rewritten]),
    tone,
    setTone,
  };
}
