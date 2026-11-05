import {
  getMessageParts,
  setMessageParts,
  useMessageParts,
} from "./message-store";
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
  const parts = useMessageParts();
  const text = parts.map((part) => part.label).join(" ");

  function replaceWithText(input: string) {
    setMessageParts(
      input
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => createPart({ label: word })),
    );
  }

  function backspace() {
    setMessageParts(applyBackspace(getMessageParts()));
  }

  function clear() {
    setMessageParts([]);
  }

  return {
    parts,
    text,
    getParts: getMessageParts,
    replaceWithText,
    backspace,
    setParts: setMessageParts,
    clear,
  };
}
