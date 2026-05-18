import {
  useProofreader,
  useRewriter,
  useSharedContext,
} from "@shared/react-built-in-ai";
import { useEffect, useState } from "react";
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
  const [sharedContext] = useSharedContext();
  const [tone, setTone] = useState<SuggestionTone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { status: proofreaderStatus, proofread } = useProofreader();
  const { status: rewriterStatus, rewrite } = useRewriter({
    tone,
    sharedContext,
    length: "shorter",
    format: "plain-text",
  });

  const isSuggestionsAvailable =
    proofreaderStatus !== "unsupported" || rewriterStatus !== "unsupported";

  useEffect(() => {
    if (proofreaderStatus !== "ready" && rewriterStatus !== "ready") {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const generateSuggestions = async () => {
      try {
        const [proofreadResult, rewritten] = await Promise.all([
          proofreaderStatus === "ready"
            ? proofread(text, { signal })
            : undefined,
          rewriterStatus === "ready" ? rewrite(text, { signal }) : undefined,
        ]);

        if (signal.aborted) {
          return;
        }

        const next = [
          proofreadResult?.correctedInput ?? "",
          rewritten ?? "",
        ].filter((s) => s && s !== text && isValidSuggestion(s));

        setSuggestions(Array.from(new Set(next)));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.warn("generateSuggestions failed:", error);
      }
    };

    void generateSuggestions();

    return () => controller.abort();
  }, [text, proofreaderStatus, proofread, rewriterStatus, rewrite]);

  return {
    phrases: suggestions,
    isAvailable: isSuggestionsAvailable,
    tone,
    setTone,
  };
}
