import {
  isProofreaderSupported,
  isRewriterSupported,
} from "@shared/ai/capabilities";
import { useAI } from "@shared/ai/useAI";
import { useProofreader } from "@shared/ai/useProofreader";
import { useRewriter } from "@shared/ai/useRewriter";
import { useEffect, useRef, useState } from "react";
import type { SuggestionTone } from "./types";

export interface UseSuggestionsReturn {
  phrases: string[];
  isAvailable: boolean;
  tone: SuggestionTone;
  setTone: (tone: SuggestionTone) => void;
}

const UNDERSCORED_WORD_PATTERN = /\b[A-Za-z]+_[A-Za-z]+\b/;

function isValidSuggestion(suggestion: string): boolean {
  if (UNDERSCORED_WORD_PATTERN.test(suggestion)) {
    return false;
  }

  if (suggestion.includes('"')) {
    return false;
  }

  return true;
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const { sharedContext } = useAI();
  const isSuggestionsAvailable = isProofreaderSupported || isRewriterSupported;

  const { createProofreader } = useProofreader();
  const { createRewriter } = useRewriter();

  const [tone, setTone] = useState<SuggestionTone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const generateSuggestions = async () => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      try {
        const proofreader = await createProofreader();
        const rewriter = await createRewriter({
          tone,
          sharedContext,
          length: "shorter",
          format: "plain-text",
        });

        const [proofread, rewritten] = await Promise.all([
          proofreader?.proofread(text, { signal }),
          rewriter?.rewrite(text, { signal }),
        ]);

        if (signal.aborted) {
          return;
        }

        const suggestions = [
          proofread?.correctedInput ?? "",
          rewritten ?? "",
        ].filter((s) => s && s !== text && isValidSuggestion(s));

        const uniqueSuggestions = Array.from(new Set(suggestions));

        setSuggestions(uniqueSuggestions);
      } catch (error) {
        if ((error as DOMException).name === "AbortError") {
          return;
        }

        console.error("generateSuggestions failed:", error);
      }
    };

    void generateSuggestions();

    return () => abortRef.current?.abort();
  }, [text, tone, sharedContext, createProofreader, createRewriter]);

  return {
    phrases: suggestions,
    isAvailable: isSuggestionsAvailable,
    tone,
    setTone,
  };
}
