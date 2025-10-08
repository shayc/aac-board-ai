import { useEffect, useState } from "react";
import { useProofreader } from "../../../hooks/ai/useProofreader";
import type { SentenceContent } from "../types";

export interface UseSuggestionsOptions {
  words: SentenceContent[];
}

/**
 * Standalone hook for managing AI-powered suggestions.
 * Uses the proofreader API to generate suggestions from user's output.
 */
export function useSuggestions(options: UseSuggestionsOptions) {
  const { words } = options;
  const proofreader = useProofreader();

  const [items, setItems] = useState<string[]>([]);
  const [tone, setTone] = useState<"normal" | "formal" | "casual">("normal");
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    // Join labels with space to create sentence
    const sentence = words.map((w) => w.label).join(" ");

    if (!sentence || !proofreader.isReady) {
      setItems([]);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await proofreader.proofread(sentence);
      console.log("Proofreader result:", result);
      setItems([result.correctedInput]);
    } catch {
      setItems([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerate = () => {
    void generate();
  };

  const changeTone = (newTone: "normal" | "formal" | "casual") => {
    setTone(newTone);
    // Tone doesn't affect output yet (future enhancement)
  };

  useEffect(() => {
    void generate();
  }, [words, proofreader.isReady]);

  return {
    items,
    tone,
    isGenerating,
    changeTone,
    regenerate,
    requestSession: proofreader.requestSession,
    proofreaderStatus: proofreader.status,
  };
}
