import { randomId } from "@shared/utils/random-id";
import type { MessagePart, MessagePartInput } from "./message-types";

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export function createPart(content: MessagePartInput): MessagePart {
  return { ...content, id: randomId(), label: content.label ?? "" };
}

export function appendPart(
  parts: readonly MessagePart[],
  content: MessagePartInput,
): readonly MessagePart[] {
  return [...parts, createPart(content)];
}

export function appendSpace(
  parts: readonly MessagePart[],
): readonly MessagePart[] {
  return appendPart(parts, { label: "" });
}

export function appendText(
  parts: readonly MessagePart[],
  text: string,
): readonly MessagePart[] {
  const lastPart = parts.at(-1);
  if (!lastPart || !isTextOnlyPart(lastPart)) {
    return appendPart(parts, { label: text });
  }

  return parts.with(-1, {
    ...lastPart,
    label: `${lastPart.label}${text}`,
  });
}

export function applyBackspace(
  parts: readonly MessagePart[],
): readonly MessagePart[] {
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
  const label = lastPart.label.slice(0, lastGrapheme?.index ?? 0);

  // A word typed after text sits behind a space. Emptying it keeps that space,
  // so the next letter starts a new word instead of joining the previous one.
  const previousPart = parts.at(-2);
  const followsText =
    previousPart !== undefined && isTextOnlyPart(previousPart);
  if (!label && !followsText) {
    return parts.slice(0, -1);
  }

  return parts.with(-1, { ...lastPart, label });
}

function isTextOnlyPart(part: MessagePart): boolean {
  return !part.imageSrc && !part.soundSrc && !part.vocalization;
}
