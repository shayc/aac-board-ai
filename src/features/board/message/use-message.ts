import { usePersistentState } from "@shared/hooks/use-persistent-state";
import type { BoardButton } from "../types";

export type MessagePartContent = Pick<
  BoardButton,
  "label" | "vocalization" | "imageSrc" | "soundSrc"
>;

// A part's content is copied from a button, but its identity is ours, minted at
// creation — the button's id isn't unique across occurrences (same button added
// twice, or colliding ids across boards), so it can't serve as part identity.
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
  return { ...content, id: crypto.randomUUID() };
}

export function useMessage(): UseMessageReturn {
  const [parts, setParts] = usePersistentState<MessagePart[]>("message", []);
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
    const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
    const words = Array.from(segmenter.segment(input))
      .filter((segment) => segment.isWordLike)
      .map((segment) => segment.segment);

    setParts(words.map((word) => createPart({ label: word })));
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
