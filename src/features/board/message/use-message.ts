import { useRef, useState } from "react";
import { useMessagePreferences } from "./message-preferences-store";
import { applyBackspace, createPart } from "./message-transforms";
import type { MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  text: string;
  getParts: () => readonly MessagePart[];
  getPartsToAddTo: () => readonly MessagePart[];
  setParts: (parts: readonly MessagePart[]) => void;
  markSpoken: (parts: readonly MessagePart[]) => void;
  replaceWithText: (input: string) => void;
  backspace: () => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const { isAutoClearEnabled } = useMessagePreferences();
  const [parts, setPartsState] = useState<readonly MessagePart[]>([]);
  const partsRef = useRef(parts);
  const spokenPartsRef = useRef<readonly MessagePart[] | null>(null);
  const text = parts.map((part) => part.label).join(" ");

  function getParts() {
    return partsRef.current;
  }

  // Every edit makes a new array, so a message counts as spoken only until it
  // changes. It stays visible after speaking so listeners can still read it.
  function getPartsToAddTo() {
    const isSpoken = partsRef.current === spokenPartsRef.current;

    return isAutoClearEnabled && isSpoken ? [] : partsRef.current;
  }

  function setParts(next: readonly MessagePart[]) {
    partsRef.current = next;
    setPartsState(next);
  }

  function markSpoken(spoken: readonly MessagePart[]) {
    spokenPartsRef.current = spoken;
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
    getPartsToAddTo,
    setParts,
    markSpoken,
    replaceWithText,
    backspace,
    clear,
  };
}
