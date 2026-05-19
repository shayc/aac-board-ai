import {
  useProofreader,
  useRewriter,
  useSharedContext,
} from "@shared/built-in-ai";
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

  const proofreaderReady = proofreader.status === "ready";
  const rewriterReady = rewriter.status === "ready";
  const isAvailable =
    proofreader.status !== "unsupported" || rewriter.status !== "unsupported";

  useEffect(() => {
    if (!proofreaderReady && !rewriterReady) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const generateSuggestions = async () => {
      try {
        const [proofreadResult, rewritten] = await Promise.all([
          proofreaderReady
            ? proofreader.proofread(text, { signal })
            : undefined,
          rewriterReady ? rewriter.rewrite(text, { signal }) : undefined,
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
  }, [text, proofreaderReady, proofreader, rewriterReady, rewriter]);

  return {
    phrases: suggestions,
    isAvailable,
    tone,
    setTone,
  };
}
