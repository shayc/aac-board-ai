import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

const store = createPersistedStore<string>("ai-shared-context", (raw) =>
  typeof raw === "string" ? raw : "",
);

export function setAISharedContext(sharedContext: string): void {
  store.setState(sharedContext);
}

export function useAISharedContext(): string {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
