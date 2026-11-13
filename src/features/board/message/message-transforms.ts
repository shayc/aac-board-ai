import { randomId } from "@shared/utils/random-id";
import type { Message, MessagePart, MessagePartInput } from "./message-types";

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export const EMPTY_MESSAGE: Message = { finishedParts: [], openWord: null };

export function createPart(content: MessagePartInput): MessagePart {
  return { ...content, id: randomId(), label: content.label ?? "" };
}

export function finishedMessage(parts: readonly MessagePart[]): Message {
  return { finishedParts: parts, openWord: null };
}

export function messageParts({
  finishedParts,
  openWord,
}: Message): readonly MessagePart[] {
  return openWord ? [...finishedParts, openWord] : finishedParts;
}

export function appendPart(message: Message, part: MessagePart): Message {
  return finishedMessage([...messageParts(message), part]);
}

export function appendText(message: Message, text: string): Message {
  // A "+" action with no letters is valid and spells nothing.
  if (!text) {
    return message;
  }

  const { openWord } = message;
  const extendedWord = openWord
    ? { ...openWord, label: `${openWord.label}${text}` }
    : createPart({ label: text, isSpelled: true });

  return { ...message, openWord: extendedWord };
}

export function finishSpelling(message: Message): Message {
  return message.openWord ? finishedMessage(messageParts(message)) : message;
}

export function applyBackspace(message: Message): Message {
  const { finishedParts, openWord } = reopenLastSpelledWord(message);
  if (!openWord) {
    return finishedParts.length > 0
      ? finishedMessage(finishedParts.slice(0, -1))
      : message;
  }

  const label = withoutLastGrapheme(openWord.label);

  return {
    finishedParts,
    openWord: label ? { ...openWord, label } : null,
  };
}

function reopenLastSpelledWord(message: Message): Message {
  const lastPart = message.finishedParts.at(-1);
  if (message.openWord || !lastPart?.isSpelled) {
    return message;
  }

  return {
    finishedParts: message.finishedParts.slice(0, -1),
    openWord: lastPart,
  };
}

function withoutLastGrapheme(text: string): string {
  const lastGrapheme = graphemeSegmenter
    .segment(text)
    .containing(text.length - 1);

  return lastGrapheme ? text.slice(0, lastGrapheme.index) : "";
}
