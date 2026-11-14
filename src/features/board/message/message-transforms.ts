import { randomId } from "@shared/utils/random-id";
import type { Message, TextPart, TilePart } from "./message-types";

export const EMPTY_MESSAGE: Message = {
  parts: [],
  isWordOpen: false,
  isSpoken: false,
};

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
  const { parts } = messageToAddTo(message);

  return { parts: [...parts, part], isWordOpen: false, isSpoken: false };
}

export function spell(message: Message, text: string): Message {
  if (!text) {
    return message;
  }

  const { parts, isWordOpen } = messageToAddTo(message);
  const lastPart = parts.at(-1);
  if (!isWordOpen || lastPart?.kind !== "text") {
    return {
      parts: [...parts, createTextPart(text)],
      isWordOpen: true,
      isSpoken: false,
    };
  }

  return {
    parts: parts.with(-1, { ...lastPart, label: `${lastPart.label}${text}` }),
    isWordOpen: true,
    isSpoken: false,
  };
}

// A spoken message has no word for a space to end: the next letter starts a
// new message either way.
export function closeWord(message: Message): Message {
  if (!message.isWordOpen || message.isSpoken) {
    return message;
  }

  return { ...message, isWordOpen: false };
}

export function markSpoken(message: Message, isSpoken: boolean): Message {
  if (message.isSpoken === isSpoken) {
    return message;
  }

  return { ...message, isSpoken };
}

// Every edit replaces the parts or changes whether the last word is open, so
// two messages that share both differ at most in whether they were spoken.
export function hasSameContent(first: Message, second: Message): boolean {
  return first.parts === second.parts && first.isWordOpen === second.isWordOpen;
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
    return { parts: message.parts, isWordOpen: true, isSpoken: false };
  }

  const label = removeLastGrapheme(lastPart.label);
  if (!label) {
    return removeLastPart(message);
  }

  return {
    parts: message.parts.with(-1, { ...lastPart, label }),
    isWordOpen: true,
    isSpoken: false,
  };
}

function messageToAddTo(message: Message): Message {
  return message.isSpoken ? EMPTY_MESSAGE : message;
}

function removeLastPart(message: Message): Message {
  return {
    parts: message.parts.slice(0, -1),
    isWordOpen: false,
    isSpoken: false,
  };
}

function removeLastGrapheme(text: string): string {
  const lastGrapheme = graphemeSegmenter
    .segment(text)
    .containing(text.length - 1);

  return text.slice(0, lastGrapheme?.index ?? 0);
}
