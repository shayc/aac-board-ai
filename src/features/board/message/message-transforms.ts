import { randomId } from "@shared/utils/random-id";
import type { MessagePart, MessagePartContent } from "./use-message";

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
  const isTextOnly =
    lastPart &&
    !lastPart.imageSrc &&
    !lastPart.soundSrc &&
    !lastPart.vocalization;

  if (!lastPart || !isTextOnly) {
    return appendPart(parts, { label: text });
  }

  return parts.with(-1, {
    ...lastPart,
    label: `${lastPart.label ?? ""}${text}`,
  });
}

export function dropLastPart(parts: MessagePart[]): MessagePart[] {
  const lastPart = parts.at(-1);
  if (!lastPart) {
    return parts;
  }

  const isTextOnly =
    !lastPart.imageSrc && !lastPart.soundSrc && !lastPart.vocalization;

  if (isTextOnly && lastPart.label && lastPart.label.length > 1) {
    return parts.with(-1, {
      ...lastPart,
      label: lastPart.label.slice(0, -1),
    });
  }

  return parts.slice(0, -1);
}
