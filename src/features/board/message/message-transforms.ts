import { randomId } from "@shared/utils/random-id";
import type { Message, MessagePart, TilePartContent } from "./message-types";

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export const EMPTY_MESSAGE: Message = { parts: [], isLastWordOpen: false };

export function createTilePart(content: TilePartContent): MessagePart {
  return {
    ...content,
    id: randomId(),
    kind: "tile",
    label: content.label ?? "",
  };
}

export function createTextPart(label: string): MessagePart {
  return { id: randomId(), kind: "text", label };
}

export function closedMessage(parts: readonly MessagePart[]): Message {
  return { parts, isLastWordOpen: false };
}

export function textMessage(text: string): Message {
  const words = text.match(/\S+/g) ?? [];

  return closedMessage(words.map(createTextPart));
}

export function appendPart(message: Message, part: MessagePart): Message {
  return closedMessage([...message.parts, part]);
}

export function spellText(message: Message, text: string): Message {
  // A "+" action with no letters is valid and spells nothing.
  if (!text) {
    return message;
  }

  const { parts, isLastWordOpen } = message;
  const lastPart = parts.at(-1);
  const spelledParts =
    isLastWordOpen && lastPart
      ? parts.with(-1, { ...lastPart, label: `${lastPart.label}${text}` })
      : [...parts, createTextPart(text)];

  return { parts: spelledParts, isLastWordOpen: true };
}

export function closeLastWord(message: Message): Message {
  return message.isLastWordOpen ? closedMessage(message.parts) : message;
}

export function deleteBackward(message: Message): Message {
  const { parts } = message;
  const lastPart = parts.at(-1);
  if (!lastPart) {
    return message;
  }

  const shortenedLabel =
    lastPart.kind === "text" ? withoutLastGrapheme(lastPart.label) : "";
  if (!shortenedLabel) {
    return closedMessage(parts.slice(0, -1));
  }

  return {
    parts: parts.with(-1, { ...lastPart, label: shortenedLabel }),
    isLastWordOpen: true,
  };
}

function withoutLastGrapheme(text: string): string {
  const lastGrapheme = graphemeSegmenter
    .segment(text)
    .containing(text.length - 1);

  return lastGrapheme ? text.slice(0, lastGrapheme.index) : "";
}
