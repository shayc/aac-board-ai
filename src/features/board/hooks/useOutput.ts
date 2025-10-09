import type { SentenceContent } from "@features/board/types";
import { useState } from "react";

/**
 * Standalone hook for managing sentence/output state.
 * Contains its own state and provides output actions.
 */
export function useOutput() {
  const [words, setWords] = useState<SentenceContent[]>([]);

  const addWord = (word: SentenceContent) => {
    setWords((prev) => [...prev, word]);
  };

  const removeWord = () => {
    setWords((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setWords([]);
  };

  return {
    words,
    addWord,
    removeWord,
    clear,
  };
}
