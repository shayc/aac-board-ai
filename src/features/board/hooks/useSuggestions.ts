import { useAI } from "@shared/contexts/AIProvider/useAI";
import {
  isProofreaderSupported,
  isRewriterSupported,
} from "@shared/hooks/ai/ai-capabilities";
import { useProofreader } from "@shared/hooks/ai/useProofreader";
import { useRewriter } from "@shared/hooks/ai/useRewriter";
import type { Tone } from "@features/board/types";
import { useEffect, useRef, useState } from "react";

const UNDERSCORED_WORD_PATTERN = /\b[A-Za-z]+_[A-Za-z]+\b/;

/**
 * Validates that an AI-generated suggestion is suitable for display.
 * Rejects suggestions that contain underscored compound words (e.g. "some_word")
 * which indicate raw tokenizer artifacts, and suggestions with quoted strings
 * which are hallucinated additions not present in the original input.
 */
function isValidSuggestion(suggestion: string): boolean {
  if (UNDERSCORED_WORD_PATTERN.test(suggestion)) {
    return false;
  }

  if (suggestion.includes('"')) {
    return false;
  }

  return true;
}

export interface UseSuggestionsReturn {
  items: string[];
  isAvailable: boolean;
  tone: Tone;
  setTone: (tone: Tone) => void;
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const { sharedContext } = useAI();
  const isSuggestionsAvailable = isProofreaderSupported || isRewriterSupported;

  const { createProofreader } = useProofreader();
  const { createRewriter } = useRewriter();

  const [tone, setTone] = useState<Tone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const generateSuggestions = async (
      text: string,
      tone: Tone,
      sharedContext?: string,
    ) => {
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

    void generateSuggestions(text, tone, sharedContext);

    return () => abortRef.current?.abort();
  }, [text, tone, sharedContext, createProofreader, createRewriter]);

  return {
    items: suggestions,
    isAvailable: isSuggestionsAvailable,
    tone,
    setTone,
  };
}
