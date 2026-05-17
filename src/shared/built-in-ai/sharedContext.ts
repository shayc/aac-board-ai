import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ai-shared-context";
const listeners = new Set<() => void>();

function readStored(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return "";
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

export function setSharedContext(next: string): void {
  if (next === value) return;
  value = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  for (const listener of listeners) listener();
}

/**
 * Shared user-authored context (e.g. tone, persona) passed to built-in AI
 * sessions. Backed by `localStorage` and broadcast to all subscribers in
 * the tab, so a write in one component is visible to the rest immediately.
 */
export function useSharedContext(): readonly [string, (next: string) => void] {
  const current = useSyncExternalStore(subscribe, () => value);
  return [current, setSharedContext];
}
