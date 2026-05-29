import { useAISharedContext } from "@shared/hooks/use-ai-shared-context";
import { useProofreader, useRewriter } from "@shayc/react-built-in-ai";
import { useEffect, useState } from "react";
import type { SuggestionTone } from "./types";

export interface UseSuggestionsReturn {
  isSupported: boolean;
  phrases: string[];
  tone: SuggestionTone;
  setTone: (tone: SuggestionTone) => void;
}

const UNDERSCORED_WORD_PATTERN = /\b[A-Za-z]+_[A-Za-z]+\b/;

function isCleanPhrase(suggestion: string): boolean {
  return (
    !UNDERSCORED_WORD_PATTERN.test(suggestion) && !suggestion.includes('"')
  );
}

function cleanSuggestions(
  candidates: readonly (string | undefined)[],
): string[] {
  const cleaned = new Set<string>();

  for (const candidate of candidates) {
    if (candidate && isCleanPhrase(candidate)) {
      cleaned.add(candidate);
    }
  }

  return [...cleaned];
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const [sharedContext] = useAISharedContext();
  const [tone, setTone] = useState<SuggestionTone>("as-is");

  const { status: proofreaderStatus, proofread } = useProofreader();
  const { status: rewriterStatus, rewrite } = useRewriter({
    tone,
    sharedContext,
    length: "shorter",
    format: "plain-text",
  });

  const isProofreaderSupported = proofreaderStatus !== "unsupported";
  const isRewriterSupported = rewriterStatus !== "unsupported";
  const isSupported = isProofreaderSupported || isRewriterSupported;

  const isProofreaderReady = proofreaderStatus === "ready";
  const isRewriterReady = rewriterStatus === "ready";

  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!isProofreaderReady && !isRewriterReady) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const generateSuggestions = async () => {
      try {
        const [proofreadResult, rewritten] = await Promise.all([
          isProofreaderReady ? proofread(text, { signal }) : undefined,
          isRewriterReady ? rewrite(text, { signal }) : undefined,
        ]);

        if (signal.aborted) {
          return;
        }

        setSuggestions(
          cleanSuggestions([proofreadResult?.correctedInput, rewritten]).filter(
            (suggestion) => suggestion !== text,
          ),
        );
      } catch {
        // Suggestion failures (engine error, or abort from cleanup) leave the prior suggestions in place.
      }
    };

    void generateSuggestions();
    return () => controller.abort();
  }, [text, isProofreaderReady, isRewriterReady, proofread, rewrite]);

  return {
    isSupported,
    phrases: suggestions,
    tone,
    setTone,
  };
}
