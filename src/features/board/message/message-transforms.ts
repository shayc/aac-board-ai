import type { MessagePart, MessagePartContent } from "./message-types";
import { randomId } from "./random-id";

export function createPart(content: MessagePartContent): MessagePart {
  return { ...content, id: randomId() };
}

export function appendPart(
  parts: readonly MessagePart[],
  content: MessagePartContent,
): readonly MessagePart[] {
  return [...parts, createPart(content)];
}

export function appendSpace(
  parts: readonly MessagePart[],
): readonly MessagePart[] {
  return appendPart(parts, { label: "" });
}

export function appendTextToLastPart(
  parts: readonly MessagePart[],
  text: string,
): readonly MessagePart[] {
  const lastPart = parts.at(-1);

  if (!lastPart || !isTextOnlyPart(lastPart)) {
    return appendPart(parts, { label: text });
  }

  return parts.with(-1, {
    ...lastPart,
    label: `${lastPart.label ?? ""}${text}`,
  });
}

export function applyBackspace(
  parts: readonly MessagePart[],
): readonly MessagePart[] {
  const lastPart = parts.at(-1);
  if (!lastPart) {
    return parts;
  }

  if (isTextOnlyPart(lastPart) && lastPart.label && lastPart.label.length > 1) {
    return parts.with(-1, {
      ...lastPart,
      label: lastPart.label.slice(0, -1),
    });
  }

  return parts.slice(0, -1);
}

function isTextOnlyPart(part: MessagePart): boolean {
  return !part.image && !part.sound && !part.vocalization;
}
