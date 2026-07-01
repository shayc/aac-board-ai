import { randomId } from "@shared/utils/random-id";
import type { MessagePart, MessagePartContent } from "./use-message";

function createPart(content: MessagePartContent): MessagePart {
  return { ...content, id: randomId() };
}

export function addPartToParts(
  parts: MessagePart[],
  content: MessagePartContent,
): MessagePart[] {
  return [...parts, createPart(content)];
}

export function addSpaceToParts(parts: MessagePart[]): MessagePart[] {
  return addPartToParts(parts, { label: "" });
}

export function appendTextToParts(
  parts: MessagePart[],
  text: string,
): MessagePart[] {
  const lastPart = parts.at(-1);
  if (!lastPart) {
    return [createPart({ label: text })];
  }

  return parts.with(-1, {
    ...lastPart,
    label: `${lastPart.label ?? ""}${text}`,
  });
}

export function removeLastPartFromParts(parts: MessagePart[]): MessagePart[] {
  return parts.slice(0, -1);
}
