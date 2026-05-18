import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ai-shared-context";
const listeners = new Set<() => void>();

function readStored(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return "";
    }
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : "";
  } catch {
    return "";
  }
}

let value = readStored();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Updates the shared context and persists it to `localStorage`. No-op when
 * the value is unchanged.
 */
export function setSharedContext(next: string): void {
  if (next === value) {
    return;
  }
  value = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  for (const listener of listeners) {
    listener();
  }
}

/**
 * User-authored context (e.g. tone, persona) passed to built-in AI sessions.
 * Returns the current value and a setter; persisted in `localStorage`.
 */
export function useSharedContext(): readonly [string, (next: string) => void] {
  const current = useSyncExternalStore(subscribe, () => value);
  return [current, setSharedContext];
}
