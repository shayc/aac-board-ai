import { useAISharedContext } from "@shared/hooks/use-ai-shared-context";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import { useProofreader, useRewriter } from "@shayc/react-built-in-ai";
import { useState } from "react";
import { toPhrases } from "./to-phrases";

const SHARED_CONTEXT_DEBOUNCE_MS = 400;

export interface UseSuggestionsReturn {
  isSupported: boolean;
  isProofreaderSupported: boolean;
  isRewriterSupported: boolean;
  isPending: boolean;
  isProofreaderPending: boolean;
  isRewriterPending: boolean;
  proofreaderError: Error | undefined;
  rewriterError: Error | undefined;
  phrases: string[];
  tone: RewriterTone;
  setTone: (tone: RewriterTone) => void;
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const sharedContext = useAISharedContext();
  const debouncedSharedContext = useDebouncedValue(
    sharedContext,
    SHARED_CONTEXT_DEBOUNCE_MS,
  );

  const [tone, setTone] = useState<RewriterTone>("as-is");
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

  const corrected = useLatestAsync({
    enabled: hasText && proofreader.status === "ready",
    deps: [text, language],
    fetch: (signal) =>
      proofreader
        .proofread(text, { signal })
        .then((result) => result.correctedInput),
  });

  const rewritten = useLatestAsync({
    enabled: hasText && rewriter.status === "ready",
    deps: [text, tone, debouncedSharedContext, language],
    fetch: (signal) => rewriter.rewrite(text, { signal }),
  });

  return {
    isSupported: isProofreaderSupported || isRewriterSupported,
    isProofreaderSupported,
    isRewriterSupported,
    isPending: corrected.isPending || rewritten.isPending,
    isProofreaderPending: corrected.isPending,
    isRewriterPending: rewritten.isPending,
    proofreaderError: corrected.error,
    rewriterError: rewritten.error,
    phrases: toPhrases(text, [corrected.value, rewritten.value]),
    tone,
    setTone,
  };
}
