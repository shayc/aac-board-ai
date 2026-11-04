import { useRef, useState } from "react";
import { applyBackspace, createPart } from "./message-transforms";
import type { MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: MessagePart[];
  text: string;
  getParts: () => MessagePart[];
  replaceWithText: (input: string) => void;
  backspace: () => void;
  setParts: (parts: MessagePart[]) => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const [parts, setPartsState] = useState<MessagePart[]>([]);
  const partsRef = useRef(parts);
  const text = parts.map((part) => part.label).join(" ");

  function getParts() {
    return partsRef.current;
  }

  function setParts(next: MessagePart[]) {
    partsRef.current = next;
    setPartsState(next);
  }

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
    setParts(applyBackspace(getParts()));
  }

  function clear() {
    setParts([]);
  }

  return {
    parts,
    text,
    getParts,
    replaceWithText,
    backspace,
    setParts,
    clear,
  };
}
