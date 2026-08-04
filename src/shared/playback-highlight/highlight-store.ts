import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

interface HighlightConfig {
  highlightActivePart: boolean;
}

const DEFAULT_CONFIG: HighlightConfig = {
  highlightActivePart: false,
};

export function parseHighlightConfig(raw: unknown): HighlightConfig {
  const parsed = (raw ?? {}) as Partial<HighlightConfig>;

  return {
    highlightActivePart:
      typeof parsed.highlightActivePart === "boolean"
        ? parsed.highlightActivePart
        : DEFAULT_CONFIG.highlightActivePart,
  };
}

const highlightStore = createPersistedStore<HighlightConfig>(
  "highlight-config",
  parseHighlightConfig,
);

export function setHighlightActivePart(highlightActivePart: boolean): void {
  highlightStore.setState({
    ...highlightStore.getSnapshot(),
    highlightActivePart,
  });
}

export function useHighlightConfig(): HighlightConfig {
  return useSyncExternalStore(
    highlightStore.subscribe,
    highlightStore.getSnapshot,
  );
}
