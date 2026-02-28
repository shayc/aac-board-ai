import { useAI } from "@shared/contexts/AIProvider/useAI";
import { useProofread } from "@shared/hooks/ai/useProofread";
import { useRewrite } from "@shared/hooks/ai/useRewrite";
import type { SuggestionTone } from "@features/board/types";
import { useState } from "react";

// AI models sometimes emit snake_case tokens or quoted fragments;
// these are artifacts, not real suggestions.
const SNAKE_CASE_WORD = /\b[A-Za-z]+_[A-Za-z]+\b/;

function isModelArtifact(text: string): boolean {
  return SNAKE_CASE_WORD.test(text) || text.includes('"');
}

function isEchoOf(suggestion: string, original: string): boolean {
  return suggestion.toLocaleLowerCase() === original.toLocaleLowerCase();
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

  const validResults = [proofread.data, rewrite.data].filter(
    (s): s is string => !!s,
  );

  const phrases = Array.from(
    new Set(
      validResults.filter((s) => !isEchoOf(s, text) && !isModelArtifact(s)),
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
