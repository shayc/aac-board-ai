import { useAISharedContext } from "@shared/hooks/use-ai-shared-context";
import {
  type ProofreaderHookReturn,
  type RewriterHookReturn,
  useProofreader,
  useRewriter,
} from "@shayc/react-built-in-ai";
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

interface SuggestionEngines {
  proofread?: ProofreaderHookReturn["proofread"];
  rewrite?: RewriterHookReturn["rewrite"];
}

async function generateSuggestions(
  text: string,
  { proofread, rewrite }: SuggestionEngines,
  signal: AbortSignal,
): Promise<string[]> {
  const [proofreadResult, rewritten] = await Promise.all([
    proofread?.(text, { signal }),
    rewrite?.(text, { signal }),
  ]);

  return cleanSuggestions([proofreadResult?.correctedInput, rewritten]).filter(
    (suggestion) => suggestion !== text,
  );
}

interface GeneratedSuggestions {
  forText: string;
  phrases: string[];
}

export function phrasesFor(
  text: string,
  generated: GeneratedSuggestions | null,
): string[] {
  return generated?.forText === text ? generated.phrases : [];
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

    const engines: SuggestionEngines = {
      proofread: isProofreaderReady ? proofread : undefined,
      rewrite: isRewriterReady ? rewrite : undefined,
    };

    const controller = new AbortController();
    const { signal } = controller;

    void (async () => {
      try {
        const phrases = await generateSuggestions(text, engines, signal);

        if (!signal.aborted) {
          setGenerated({ forText: text, phrases });
        }
      } catch {
        // Abort or engine error: keep the prior result as-is — phrasesFor surfaces it only while its text still matches.
      }
    })();

    return () => controller.abort();
  }, [text, isProofreaderReady, isRewriterReady, proofread, rewrite]);

  return {
    isSupported,
    phrases: phrasesFor(text, generated),
    tone,
    setTone,
  };
}
