import type { MessagePart, MessagePartInput } from "./message-types";
import { randomId } from "./random-id";

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export function createPart(content: MessagePartInput): MessagePart {
  return { ...content, id: randomId(), label: content.label ?? "" };
}

export function appendPart(
  parts: MessagePart[],
  content: MessagePartInput,
): MessagePart[] {
  return [...parts, createPart(content)];
}

export function appendSpace(
  parts: MessagePart[],
  language: string,
): MessagePart[] {
  return appendPart(parts, { label: "", language });
}

export function appendText(
  parts: MessagePart[],
  text: string,
  language: string,
): MessagePart[] {
  const lastPart = parts.at(-1);

  if (!lastPart || !canContinueText(lastPart, language)) {
    return appendPart(parts, { label: text, language });
  }

  return parts.with(-1, {
    ...lastPart,
    label: `${lastPart.label}${text}`,
  });
}

export function applyBackspace(parts: MessagePart[]): MessagePart[] {
  const lastPart = parts.at(-1);
  if (!lastPart) {
    return parts;
  }

  if (!isTextOnlyPart(lastPart) || !lastPart.label) {
    return parts.slice(0, -1);
  }

  const lastGrapheme = graphemeSegmenter
    .segment(lastPart.label)
    .containing(lastPart.label.length - 1);

  if (!lastGrapheme || lastGrapheme.index === 0) {
    return parts.slice(0, -1);
  }

  return parts.with(-1, {
    ...lastPart,
    label: lastPart.label.slice(0, lastGrapheme.index),
  });
}

function canContinueText(part: MessagePart, language: string): boolean {
  return isTextOnlyPart(part) && part.language === language;
}

function isTextOnlyPart(part: MessagePart): boolean {
  return !part.imageSrc && !part.soundSrc && !part.vocalization;
}
