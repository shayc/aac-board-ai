import { createExternalStore, type ExternalStore } from "./external-store";

const reloaders = new Set<() => void>();

export function reloadPersistedStores(): void {
  for (const reload of reloaders) {
    reload();
  }
}

export function createPersistedStore<State>(
  storageKey: string,
  parse: (raw: unknown) => State,
): ExternalStore<State> {
  function load(): State {
    try {
      const raw = localStorage.getItem(storageKey);

      return parse(raw === null ? undefined : JSON.parse(raw));
    } catch {
      return parse(undefined);
    }
  }

  const store = createExternalStore<State>(load());

  function persist(state: State) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Storage failures (quota, private mode) shouldn't break the in-memory store.
    }
  }

  function setState(next: State) {
    persist(next);
    store.setState(next);
  }

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
