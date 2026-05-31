import { createExternalStore, type ExternalStore } from "./external-store";

// An external store seeded from localStorage and written back on every change.
// `parse` receives the JSON-parsed value (or undefined when absent/corrupt) and
// must return a complete, validated state — it owns defaulting and clamping.
export function createPersistedStore<T>(
  storageKey: string,
  parse: (raw: unknown) => T,
): ExternalStore<T> {
  function load(): T {
    try {
      const raw = localStorage.getItem(storageKey);

      return parse(raw === null ? undefined : JSON.parse(raw));
    } catch {
      return parse(undefined);
    }
  }

  const store = createExternalStore<T>(load());

  store.subscribe(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(store.getSnapshot()));
    } catch {
      // Storage failures (quota, private mode) shouldn't break the in-memory store.
    }
  });

  return store;
}
