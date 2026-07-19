import { useState } from "react";
import { createPart, dropLastPart } from "./message-transforms";
import type { MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: MessagePart[];
  text: string;
  setFromText: (input: string) => void;
  removeLastPart: () => void;
  setParts: (parts: MessagePart[]) => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const [parts, setParts] = useState<MessagePart[]>([]);
  const text = parts.map((part) => part.label).join(" ");

  function setFromText(input: string) {
    setParts(
      input
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => createPart({ label: word })),
    );
  }

  function removeLastPart() {
    setParts((prev) => dropLastPart(prev));
  }

  function clear() {
    setParts([]);
  }

  return {
    parts,
    text,
    setFromText,
    removeLastPart,
    setParts,
    clear,
  };
}
