import { useRef, useState } from "react";
import { applyBackspace, createPart } from "./message-transforms";
import type { MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  text: string;
  getParts: () => readonly MessagePart[];
  setParts: (parts: readonly MessagePart[]) => void;
  replaceWithText: (input: string) => void;
  backspace: () => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const [parts, setPartsState] = useState<readonly MessagePart[]>([]);
  const partsRef = useRef(parts);
  const text = parts.map((part) => part.label).join(" ");

  function getParts() {
    return partsRef.current;
  }

  function setParts(next: readonly MessagePart[]) {
    partsRef.current = next;
    setPartsState(next);
  }

  function replaceWithText(input: string) {
    const words = input.match(/\S+/g) ?? [];
    setParts(words.map((word) => createPart({ label: word })));
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
    setParts,
    replaceWithText,
    backspace,
    clear,
  };
}
