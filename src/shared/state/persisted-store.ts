import { createExternalStore, type ExternalStore } from "./external-store";

export type StorageArea = "local" | "session";

const reloaders = new Set<() => void>();

export function reloadPersistedStores(): void {
  for (const reload of reloaders) {
    reload();
  }
}

function storageFor(area: StorageArea): Storage {
  return area === "session" ? sessionStorage : localStorage;
}

export function createPersistedStore<T>(
  storageKey: string,
  parse: (raw: unknown) => T,
  area: StorageArea = "local",
): ExternalStore<T> {
  function load(): T {
    try {
      const raw = storageFor(area).getItem(storageKey);

      return parse(raw === null ? undefined : JSON.parse(raw));
    } catch {
      return parse(undefined);
    }
  }

  const store = createExternalStore<T>(load());

  const persist = () => {
    try {
      storageFor(area).setItem(storageKey, JSON.stringify(store.getSnapshot()));
    } catch {
      // Storage failures (quota, private mode) shouldn't break the in-memory store.
    }
  };

  store.subscribe(persist);
  reloaders.add(() => store.setState(load()));

  return store;
}
