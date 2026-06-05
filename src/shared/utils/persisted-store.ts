import { debounce } from "./debounce";
import { createExternalStore, type ExternalStore } from "./external-store";

const PERSIST_DEBOUNCE_MS = 200;

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

  const persist = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(store.getSnapshot()));
    } catch {
      // Storage failures (quota, private mode) shouldn't break the in-memory store.
    }
  };

  store.subscribe(debounce(persist, PERSIST_DEBOUNCE_MS));

  return store;
}
