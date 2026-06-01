import { randomId } from "@shared/utils/random-id";
import { useState } from "react";
import type { BoardButton } from "../types";

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
  clear: () => void;
}

function createPart(content: MessagePartContent): MessagePart {
  return { ...content, id: randomId() };
}

export function useMessage(): UseMessageReturn {
  const [parts, setParts] = useState<MessagePart[]>([]);
  const text = parts.map((part) => part.label).join(" ");

  function addPart(content: MessagePartContent) {
    setParts((prev) => [...prev, createPart(content)]);
  }

  function addSpace() {
    addPart({ label: "" });
  }

  function appendText(text: string) {
    setParts((prev) => {
      const lastPart = prev.at(-1);
      if (!lastPart) {
        return [createPart({ label: text })];
      }

      return prev.with(-1, {
        ...lastPart,
        label: `${lastPart.label ?? ""}${text}`,
      });
    });
  }

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
    setParts((prev) => prev.slice(0, -1));
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
    clear,
  };
}
