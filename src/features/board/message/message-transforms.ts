import { randomId } from "@shared/utils/random-id";
import type {
  MessagePart,
  MessageState,
  TextPart,
  TilePart,
} from "./message-types";

export const EMPTY_MESSAGE: MessageState = { parts: [], isWordOpen: false };

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export function createTilePart(
  content: Omit<TilePart, "kind" | "id">,
): TilePart {
  return { ...content, kind: "tile", id: randomId() };
}

export function createTextPart(label: string): TextPart {
  return { kind: "text", id: randomId(), label };
}

export function appendPart(
  state: MessageState,
  part: MessagePart,
): MessageState {
  return { parts: [...state.parts, part], isWordOpen: false };
}

export function spellText(state: MessageState, text: string): MessageState {
  if (!text) {
    return state;
  }

  const lastPart = state.parts.at(-1);
  if (!state.isWordOpen || lastPart?.kind !== "text") {
    return {
      parts: [...state.parts, createTextPart(text)],
      isWordOpen: true,
    };
  }

  return {
    parts: state.parts.with(-1, {
      ...lastPart,
      label: `${lastPart.label}${text}`,
    }),
    isWordOpen: true,
  };
}

export function finishWord(state: MessageState): MessageState {
  if (!state.isWordOpen) {
    return state;
  }

  return { ...state, isWordOpen: false };
}

export function applyBackspace(state: MessageState): MessageState {
  const lastPart = state.parts.at(-1);
  if (!lastPart) {
    return state;
  }

  if (lastPart.kind === "tile") {
    return removeLastPart(state);
  }

  const label = removeLastGrapheme(lastPart.label);
  if (!label) {
    return removeLastPart(state);
  }

  // The space after a word has no symbol of its own in the message bar, so
  // backspace shortens a finished word and reopens it in the same press.
  return {
    parts: state.parts.with(-1, { ...lastPart, label }),
    isWordOpen: true,
  };
}

function removeLastPart(state: MessageState): MessageState {
  return { parts: state.parts.slice(0, -1), isWordOpen: false };
}

function removeLastGrapheme(text: string): string {
  const lastGrapheme = graphemeSegmenter
    .segment(text)
    .containing(text.length - 1);

  return text.slice(0, lastGrapheme?.index ?? 0);
}
