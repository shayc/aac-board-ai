import { usePersistentState } from "@shared/hooks/use-persistent-state";
import type { BoardButton } from "../types";

export type MessagePart = Pick<
  BoardButton,
  "id" | "label" | "vocalization" | "imageSrc" | "soundSrc"
>;

export interface UseMessageReturn {
  parts: MessagePart[];
  text: string;
  addPart: (part: MessagePart) => void;
  addSpace: () => void;
  setFromText: (input: string) => void;
  removeLastPart: () => void;
  updateLastPart: (part: MessagePart) => void;
  clear: () => void;
}

export function useMessage(): UseMessageReturn {
  const [parts, setParts] = usePersistentState<MessagePart[]>("message", []);
  const text = parts.map((part) => part.label).join(" ");

  function addPart(part: MessagePart) {
    setParts((prev) => [...prev, part]);
  }

  function removeLastPart() {
    setParts((prev) => prev.slice(0, -1));
  }

  function updateLastPart(part: MessagePart) {
    setParts((prev) => {
      const lastPart = prev.at(-1);
      if (!lastPart) {
        return [part];
      }

      return prev.with(-1, { ...lastPart, ...part });
    });
  }

  function clear() {
    setParts([]);
  }

  function addSpace() {
    addPart({
      id: crypto.randomUUID(),
      label: "",
    });
  }

  function setFromText(input: string) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
    const words = Array.from(segmenter.segment(input))
      .filter((segment) => segment.isWordLike)
      .map((segment) => segment.segment);

    setParts(words.map((word) => ({ id: crypto.randomUUID(), label: word })));
  }

  return {
    parts,
    text,
    addPart,
    addSpace,
    setFromText,
    removeLastPart,
    updateLastPart,
    clear,
  };
}
