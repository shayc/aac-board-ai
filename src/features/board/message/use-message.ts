import { useState } from "react";
import { applyBackspace, createPart } from "./message-transforms";
import type { MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: MessagePart[];
  text: string;
  replaceWithText: (input: string) => void;
  backspace: () => void;
  setParts: (parts: MessagePart[]) => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const [parts, setParts] = useState<MessagePart[]>([]);
  const text = parts.map((part) => part.label).join(" ");

  function replaceWithText(input: string) {
    setParts(
      input
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => createPart({ label: word })),
    );
  }

  function backspace() {
    setParts((prev) => applyBackspace(prev));
  }

  function clear() {
    setParts([]);
  }

  return {
    parts,
    text,
    replaceWithText,
    backspace,
    setParts,
    clear,
  };
}
