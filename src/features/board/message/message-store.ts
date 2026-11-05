import { createPersistedStore } from "@shared/state/persisted-store";
import { useSyncExternalStore } from "react";
import type { MessagePart } from "./message-types";

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseReloadSafeUrl(value: unknown): string | undefined {
  const url = parseOptionalString(value);

  return url?.startsWith("blob:") ? undefined : url;
}

function parseMessagePart(raw: unknown): MessagePart | undefined {
  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }

  const stored = raw as Record<string, unknown>;
  if (typeof stored.id !== "string" || typeof stored.label !== "string") {
    return undefined;
  }

  return {
    id: stored.id,
    label: stored.label,
    vocalization: parseOptionalString(stored.vocalization),
    imageSrc: parseReloadSafeUrl(stored.imageSrc),
    soundSrc: parseReloadSafeUrl(stored.soundSrc),
  };
}

export function parseMessageParts(raw: unknown): MessagePart[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => parseMessagePart(item) ?? []);
}

const messageStore = createPersistedStore<MessagePart[]>(
  "message",
  parseMessageParts,
  "session",
);

export const getMessageParts = messageStore.getSnapshot;

export const setMessageParts = messageStore.setState;

export function useMessageParts(): MessagePart[] {
  return useSyncExternalStore(messageStore.subscribe, messageStore.getSnapshot);
}
