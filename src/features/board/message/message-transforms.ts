import type { MessagePart, MessagePartContent } from "./message-types";
import { randomId } from "./random-id";

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export function createPart(content: MessagePartContent): MessagePart {
  return { ...content, id: randomId() };
}

export function appendPart(
  parts: MessagePart[],
  content: MessagePartContent,
): MessagePart[] {
  return [...parts, createPart(content)];
}

export function appendSpace(parts: MessagePart[]): MessagePart[] {
  return appendPart(parts, { label: "" });
}

export function appendTextToLastPart(
  parts: MessagePart[],
  text: string,
): MessagePart[] {
  const lastPart = parts.at(-1);

  if (!lastPart || !isTextOnlyPart(lastPart)) {
    return appendPart(parts, { label: text });
  }

  return parts.with(-1, {
    ...lastPart,
    label: `${lastPart.label ?? ""}${text}`,
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

function isTextOnlyPart(part: MessagePart): boolean {
  return !part.imageSrc && !part.soundSrc && !part.vocalization;
}
