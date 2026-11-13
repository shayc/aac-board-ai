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
  message: MessageState,
  part: MessagePart,
): MessageState {
  return { parts: [...message.parts, part], isWordOpen: false };
}

export function spellText(message: MessageState, text: string): MessageState {
  if (!text) {
    return message;
  }

  const lastPart = message.parts.at(-1);
  if (!message.isWordOpen || lastPart?.kind !== "text") {
    return {
      parts: [...message.parts, createTextPart(text)],
      isWordOpen: true,
    };
  }

  return {
    parts: message.parts.with(-1, {
      ...lastPart,
      label: `${lastPart.label}${text}`,
    }),
    isWordOpen: true,
  };
}

export function finishWord(message: MessageState): MessageState {
  if (!message.isWordOpen) {
    return message;
  }

  return { ...message, isWordOpen: false };
}

export function applyBackspace(message: MessageState): MessageState {
  const lastPart = message.parts.at(-1);
  if (!lastPart) {
    return message;
  }

  if (lastPart.kind === "tile") {
    return removeLastPart(message);
  }

  const label = removeLastGrapheme(lastPart.label);
  if (!label) {
    return removeLastPart(message);
  }

  // The space after a word has no symbol of its own in the message bar, so
  // backspace shortens a finished word and reopens it in the same press.
  return {
    parts: message.parts.with(-1, { ...lastPart, label }),
    isWordOpen: true,
  };
}

function removeLastPart(message: MessageState): MessageState {
  return { parts: message.parts.slice(0, -1), isWordOpen: false };
}

function removeLastGrapheme(text: string): string {
  const lastGrapheme = graphemeSegmenter
    .segment(text)
    .containing(text.length - 1);

  return text.slice(0, lastGrapheme?.index ?? 0);
}
