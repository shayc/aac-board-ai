import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import { useState } from "react";
import { applyBackspace, createPart } from "./message-transforms";
import type { MessagePart } from "./message-types";

export interface UseMessageReturn {
  parts: readonly MessagePart[];
  text: string;
  getParts: () => readonly MessagePart[];
  replaceWithText: (input: string) => void;
  backspace: () => void;
  setParts: (parts: readonly MessagePart[]) => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  // A store rather than state: activation reads the parts again after
  // playback ends, when a render's own copy may be out of date.
  const [partsStore] = useState(() =>
    createExternalStore<readonly MessagePart[]>([]),
  );
  const parts = useExternalStore(partsStore);
  const text = parts.map((part) => part.label).join(" ");

  const getParts = partsStore.getSnapshot;

  function setParts(next: readonly MessagePart[]) {
    partsStore.setState(next);
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
    replaceWithText,
    backspace,
    setParts,
    clear,
  };
}
