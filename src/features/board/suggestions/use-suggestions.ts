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

interface GeneratedSuggestions {
  forText: string;
  corrected?: string;
  rewritten?: string;
}

export function phrasesFor(
  text: string,
  generated: GeneratedSuggestions | null,
): string[] {
  if (generated?.forText !== text) {
    return [];
  }

  return cleanSuggestions([generated.corrected, generated.rewritten]).filter(
    (suggestion) => suggestion !== text,
  );
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

  const [generated, setGenerated] = useState<GeneratedSuggestions | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      return;
    }

    if (!isProofreaderReady && !isRewriterReady) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const merge = async (pending: Promise<Partial<GeneratedSuggestions>>) => {
      try {
        const patch = await pending;
        if (signal.aborted) {
          return;
        }

        setGenerated((prev) => ({
          ...(prev?.forText === text ? prev : undefined),
          forText: text,
          ...patch,
        }));
      } catch {
        // Ignore aborts and engine errors; the prior suggestions stay.
      }
    };

    if (isProofreaderReady) {
      void merge(
        proofread(text, { signal }).then((result) => ({
          corrected: result.correctedInput,
        })),
      );
    }

    if (isRewriterReady) {
      void merge(
        rewrite(text, { signal }).then((rewritten) => ({ rewritten })),
      );
    }

    return () => controller.abort();
  }, [text, isProofreaderReady, isRewriterReady, proofread, rewrite]);

  return {
    isSupported,
    phrases: phrasesFor(text, generated),
    tone,
    setTone,
  };
}
