import { useState } from "react";

interface SentenceContent {
  id: string;
  label: string;
  image?: string;
  vocalization?: string;
}

export function useOutput() {
  const [words, setWords] = useState<SentenceContent[]>([]);

  const addWord = (content: SentenceContent) => {
    setWords((prev) => [...prev, content]);
  };

  const removeLastWord = () => {
    setWords((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setWords([]);
  };

  return {
    words,
    addWord,
    removeLastWord,
    clear,
  };
}
