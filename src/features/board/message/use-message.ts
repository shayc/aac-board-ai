import { useState } from "react";
import type { BoardButton } from "../types";
import {
  addPartToParts,
  addSpaceToParts,
  appendTextToParts,
  removeLastPartFromParts,
} from "./message-transforms";

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
  addPart: (content: MessagePartContent) => void;
  addSpace: () => void;
  appendText: (text: string) => void;
  setFromText: (input: string) => void;
  removeLastPart: () => void;
  setParts: (parts: MessagePart[]) => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const [parts, setParts] = useState<MessagePart[]>([]);
  const text = parts.map((part) => part.label).join(" ");

  function addPart(content: MessagePartContent) {
    setParts((prev) => addPartToParts(prev, content));
  }

  function addSpace() {
    setParts((prev) => addSpaceToParts(prev));
  }

  function appendText(text: string) {
    setParts((prev) => appendTextToParts(prev, text));
  }

  function setFromText(input: string) {
    setParts(
      input
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .reduce<MessagePart[]>(
          (prev, word) => addPartToParts(prev, { label: word }),
          [],
        ),
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
    addPart,
    addSpace,
    appendText,
    setFromText,
    removeLastPart,
    setParts,
    clear,
  };
}
