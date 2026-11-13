import { randomId } from "@shared/utils/random-id";
import type { Message, TextPart, TilePart } from "./message-types";

export const EMPTY_MESSAGE: Message = { parts: [], isWordOpen: false };

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

export function appendTilePart(message: Message, part: TilePart): Message {
  return { parts: [...message.parts, part], isWordOpen: false };
}

export function spell(message: Message, text: string): Message {
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

export function closeWord(message: Message): Message {
  if (!message.isWordOpen) {
    return message;
  }

  return { ...message, isWordOpen: false };
}

export function applyBackspace(message: Message): Message {
  const lastPart = message.parts.at(-1);
  if (!lastPart) {
    return message;
  }

  if (lastPart.kind === "tile") {
    return removeLastPart(message);
  }

  if (!message.isWordOpen) {
    return { ...message, isWordOpen: true };
  }

  const label = removeLastGrapheme(lastPart.label);
  if (!label) {
    return removeLastPart(message);
  }

  return {
    parts: message.parts.with(-1, { ...lastPart, label }),
    isWordOpen: true,
  };
}

function removeLastPart(message: Message): Message {
  return { parts: message.parts.slice(0, -1), isWordOpen: false };
}

function removeLastGrapheme(text: string): string {
  const lastGrapheme = graphemeSegmenter
    .segment(text)
    .containing(text.length - 1);

  return text.slice(0, lastGrapheme?.index ?? 0);
}
