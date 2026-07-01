import { useState } from "react";
import type { BoardButton } from "../types";
import { createPart, removeLastPartFromParts } from "./message-transforms";

export type MessagePartContent = Pick<
  BoardButton,
  "label" | "vocalization" | "imageSrc" | "soundSrc"
>;

// Identity is ours, minted at creation — a button's id can't serve, since it isn't
// unique across occurrences (same button added twice, or ids colliding across boards).
export type MessagePart = { id: string } & MessagePartContent;

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
    setParts((prev) => removeLastPartFromParts(prev));
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
