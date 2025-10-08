import { useEffect, useState } from "react";
import type { SentenceContent } from "../types";

export interface UseSuggestionsOptions {
  words: SentenceContent[];
}

/**
 * Standalone hook for managing AI-powered suggestions.
 * Contains its own state and provides suggestion actions.
 */
export function useSuggestions(options: UseSuggestionsOptions) {
  const { words } = options;

  const [items, setItems] = useState<string[]>([]);
  const [tone, setTone] = useState<"normal" | "formal" | "casual">("normal");
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = () => {
    setItems(
      words.length > 0
        ? [
            `${words.map((w) => w.label).join(" ")} please`,
            `I need ${words.map((w) => w.label).join(" ")}`,
            `Can I have ${words.map((w) => w.label).join(" ")}?`,
          ]
        : [
            "I'm hungry, I'd like a sandwich",
            "I'm hungry, I'd like a salad",
            "I'm thirsty, I'd like a drink",
          ]
    );
    setIsGenerating(false);
  };

  const regenerate = () => {
    setIsGenerating(true);
    generate();
  };

  const changeTone = (newTone: "normal" | "formal" | "casual") => {
    setTone(newTone);
    generate();
  };

  useEffect(() => {
    generate();
  }, [words]);

  return {
    items,
    tone,
    isGenerating,
    changeTone,
    regenerate,
  };
}
