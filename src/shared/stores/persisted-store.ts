import { createExternalStore, type ExternalStore } from "./external-store";

const reloaders = new Set<() => void>();

export function reloadPersistedStores(): void {
  for (const reload of reloaders) {
    reload();
  }
}

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

  function persist(state: T) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Storage failures (quota, private mode) shouldn't break the in-memory store.
    }
  }

  function setState(next: T) {
    persist(next);
    store.setState(next);
  }

  // A reload never writes back what it read: two tabs on different app
  // versions could each rewrite the other's value in its own shape, forever.
  function reload() {
    store.setState(load());
  }

  function handleStorage(event: StorageEvent) {
    if (event.storageArea !== localStorage) {
      return;
    }

    if (event.key === storageKey || event.key === null) {
      reload();
    }
  }

  reloaders.add(reload);
  window.addEventListener("storage", handleStorage);

  return { ...store, setState };
}
