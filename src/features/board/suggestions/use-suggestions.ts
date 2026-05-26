import { useAISharedContext } from "@shared/hooks/use-ai-shared-context";
import { useProofreader, useRewriter } from "@shayc/react-built-in-ai";
import { useEffect, useState } from "react";
import type { SuggestionTone } from "./types";

export interface UseSuggestionsReturn {
  phrases: string[];
  isSupported: boolean;
  tone: SuggestionTone;
  setTone: (tone: SuggestionTone) => void;
}

const UNDERSCORED_WORD_PATTERN = /\b[A-Za-z]+_[A-Za-z]+\b/;

function isUsefulSuggestion(suggestion: string, original: string): boolean {
  if (!suggestion || suggestion === original) {
    return false;
  }
  if (UNDERSCORED_WORD_PATTERN.test(suggestion)) {
    return false;
  }
  if (suggestion.includes('"')) {
    return false;
  }
  return true;
}

function collectSuggestions(
  candidates: readonly (string | undefined)[],
  original: string,
): string[] {
  const accepted = new Set<string>();
  for (const candidate of candidates) {
    if (candidate && isUsefulSuggestion(candidate, original)) {
      accepted.add(candidate);
    }
  }
  return [...accepted];
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const [sharedContext] = useAISharedContext();
  const [tone, setTone] = useState<SuggestionTone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { status: proofreaderStatus, proofread } = useProofreader();
  const { status: rewriterStatus, rewrite } = useRewriter({
    tone,
    sharedContext,
    length: "shorter",
    format: "plain-text",
  });

  const isProofreaderReady = proofreaderStatus === "ready";
  const isRewriterReady = rewriterStatus === "ready";
  const isSupported =
    proofreaderStatus !== "unsupported" || rewriterStatus !== "unsupported";

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
          collectSuggestions(
            [proofreadResult?.correctedInput, rewritten],
            text,
          ),
        );
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
      }
    };

    void generateSuggestions();
    return () => controller.abort();
  }, [text, isProofreaderReady, proofread, isRewriterReady, rewrite]);

  return {
    phrases: suggestions,
    isSupported,
    tone,
    setTone,
  };
}
