import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

const DEFAULT_TONE: RewriterTone = "as-is";
const TONES: readonly RewriterTone[] = ["as-is", "more-formal", "more-casual"];

const store = createPersistedStore<RewriterTone>("ai-tone", (raw) =>
  TONES.includes(raw as RewriterTone) ? (raw as RewriterTone) : DEFAULT_TONE,
);

export function setAITone(tone: RewriterTone): void {
  store.setState(tone);
}

export function useAITone(): RewriterTone {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
