import { useSharedContext } from "@shared/ai/sharedContext";
import { useProofreader } from "@shared/ai/useProofreader";
import { useRewriter } from "@shared/ai/useRewriter";
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

  const proofreader = useProofreader();
  const rewriter = useRewriter({
    tone,
    sharedContext,
    length: "shorter",
    format: "plain-text",
  });

  const isSuggestionsAvailable =
    proofreader.status !== "unsupported" || rewriter.status !== "unsupported";

  useEffect(() => {
    if (proofreader.status !== "ready" && rewriter.status !== "ready") {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const generateSuggestions = async () => {
      try {
        const [proofread, rewritten] = await Promise.all([
          proofreader.session?.proofread(text, { signal }),
          rewriter.session?.rewrite(text, { signal }),
        ]);

        if (signal.aborted) {
          return;
        }

        const next = [proofread?.correctedInput ?? "", rewritten ?? ""].filter(
          (s) => s && s !== text && isValidSuggestion(s),
        );

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
  }, [
    text,
    proofreader.status,
    proofreader.session,
    rewriter.status,
    rewriter.session,
  ]);

  return {
    phrases: suggestions,
    isAvailable: isSuggestionsAvailable,
    tone,
    setTone,
  };
}
