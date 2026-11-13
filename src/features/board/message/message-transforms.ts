import { randomId } from "@shared/utils/random-id";
import type { Message, MessagePart, MessagePartInput } from "./message-types";

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export const EMPTY_MESSAGE: Message = { finishedParts: [], spelledWord: null };

export function createPart(content: MessagePartInput): MessagePart {
  return { ...content, id: randomId(), label: content.label ?? "" };
}

export function finishedMessage(parts: readonly MessagePart[]): Message {
  return { finishedParts: parts, spelledWord: null };
}

export function messageParts({
  finishedParts,
  spelledWord,
}: Message): readonly MessagePart[] {
  return spelledWord ? [...finishedParts, spelledWord] : finishedParts;
}

export function appendPart(message: Message, part: MessagePart): Message {
  return finishedMessage([...messageParts(message), part]);
}

export function appendText(message: Message, text: string): Message {
  // A "+" action with no letters is valid and spells nothing.
  if (!text) {
    return message;
  }

  const { spelledWord } = message;
  const extendedWord = spelledWord
    ? { ...spelledWord, label: `${spelledWord.label}${text}` }
    : createPart({ label: text });

  return { ...message, spelledWord: extendedWord };
}

export function finishSpelling(message: Message): Message {
  return finishedMessage(messageParts(message));
}

export function applyBackspace({
  finishedParts,
  spelledWord,
}: Message): Message {
  if (!spelledWord) {
    return finishedMessage(finishedParts.slice(0, -1));
  }

  const label = withoutLastGrapheme(spelledWord.label);

  return {
    finishedParts,
    spelledWord: label ? { ...spelledWord, label } : null,
  };
}

function withoutLastGrapheme(text: string): string {
  const lastGrapheme = graphemeSegmenter
    .segment(text)
    .containing(text.length - 1);

  return lastGrapheme ? text.slice(0, lastGrapheme.index) : "";
}
