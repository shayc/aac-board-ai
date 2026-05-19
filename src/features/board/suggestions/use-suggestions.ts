import { useProofreader, useRewriter } from "@shared/built-in-ai";
import { useEffect, useState } from "react";
import type { SuggestionTone } from "./types";
import { useCustomInstructions } from "./use-custom-instructions";

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
  const out = new Set<string>();
  for (const candidate of candidates) {
    if (candidate && isUsefulSuggestion(candidate, original)) {
      out.add(candidate);
    }
  }
  return [...out];
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const [sharedContext] = useCustomInstructions();
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
        console.warn("generateSuggestions failed:", error);
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
