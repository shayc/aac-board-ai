import { useAI } from "@shared/contexts/AIProvider/useAI";
import { useProofread } from "@shared/hooks/ai/useProofread";
import { useRewrite } from "@shared/hooks/ai/useRewrite";
import type { SuggestionTone } from "@features/board/types";
import { useState } from "react";

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

export interface UseSuggestionsReturn {
  phrases: string[];
  isAvailable: boolean;
  isLoading: boolean;
  error: Error | null;
  tone: SuggestionTone;
  setTone: (tone: SuggestionTone) => void;
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const { sharedContext } = useAI();
  const [tone, setTone] = useState<SuggestionTone>("as-is");

  const proofread = useProofread(text);
  const rewrite = useRewrite(text, { tone, sharedContext });

  const isAvailable = proofread.isSupported || rewrite.isSupported;
  const isLoading = proofread.isLoading || rewrite.isLoading;
  const error = proofread.error ?? rewrite.error;

  const phrases = Array.from(
    new Set(
      [proofread.data, rewrite.data].filter(
        (s): s is string => !!s && s !== text && isValidSuggestion(s),
      ),
    ),
  );

  return {
    phrases,
    isAvailable,
    isLoading,
    error,
    tone,
    setTone,
  };
}
