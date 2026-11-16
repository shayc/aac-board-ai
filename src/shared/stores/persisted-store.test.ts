import { beforeEach, describe, expect, test } from "vitest";
import { createPersistedStore, reloadPersistedStores } from "./persisted-store";

interface Counter {
  count: number;
}

function dispatchStorageFromAnotherTab(
  key: string | null,
  storageArea: Storage = localStorage,
) {
  window.dispatchEvent(new StorageEvent("storage", { key, storageArea }));
}

function parseCounter(raw: unknown): Counter {
  const parsed = (raw ?? {}) as Partial<Counter>;

  return { count: typeof parsed.count === "number" ? parsed.count : 0 };
}

describe("createPersistedStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("seeds state from the parsed default when storage is empty", () => {
    const store = createPersistedStore("counter", parseCounter);

    expect(store.getSnapshot()).toEqual({ count: 0 });
  });

  test("loads and parses an existing stored value", () => {
    localStorage.setItem("counter", JSON.stringify({ count: 5 }));

    const store = createPersistedStore("counter", parseCounter);

    expect(store.getSnapshot()).toEqual({ count: 5 });
  });

  test("falls back to the parsed default on malformed JSON", () => {
    localStorage.setItem("counter", "{ not json");

    const store = createPersistedStore("counter", parseCounter);

    expect(store.getSnapshot()).toEqual({ count: 0 });
  });

  test("writes the snapshot back to localStorage on change", () => {
    const store = createPersistedStore("counter", parseCounter);

    store.setState({ count: 9 });

    expect(localStorage.getItem("counter")).toBe(JSON.stringify({ count: 9 }));
  });

  test("reloads registered stores to their parsed defaults after storage is cleared", () => {
    const store = createPersistedStore("counter", parseCounter);

    store.setState({ count: 9 });
    localStorage.clear();
    reloadPersistedStores();

    expect(store.getSnapshot()).toEqual({ count: 0 });
  });

  test("reloads when another tab writes its key", () => {
    const store = createPersistedStore("counter", parseCounter);

    localStorage.setItem("counter", JSON.stringify({ count: 4 }));
    dispatchStorageFromAnotherTab("counter");

    expect(store.getSnapshot()).toEqual({ count: 4 });
  });

  test("leaves another tab's value as written when reloading it", () => {
    const store = createPersistedStore("counter", parseCounter);
    const valueFromNewerVersion = JSON.stringify({ count: 4, step: 2 });

    localStorage.setItem("counter", valueFromNewerVersion);
    dispatchStorageFromAnotherTab("counter");

    expect(store.getSnapshot()).toEqual({ count: 4 });
    expect(localStorage.getItem("counter")).toBe(valueFromNewerVersion);
  });

  test("reloads to its parsed default when another tab clears storage", () => {
    const store = createPersistedStore("counter", parseCounter);

    store.setState({ count: 9 });
    localStorage.clear();
    dispatchStorageFromAnotherTab(null);

    expect(store.getSnapshot()).toEqual({ count: 0 });
  });

  test("ignores another tab's write to a different key", () => {
    const store = createPersistedStore("counter", parseCounter);

    store.setState({ count: 9 });
    localStorage.setItem("counter", JSON.stringify({ count: 4 }));
    dispatchStorageFromAnotherTab("other");

    expect(store.getSnapshot()).toEqual({ count: 9 });
  });

  test("ignores another tab's session storage write to the same key", () => {
    const store = createPersistedStore("counter", parseCounter);

    store.setState({ count: 9 });
    localStorage.setItem("counter", JSON.stringify({ count: 4 }));
    dispatchStorageFromAnotherTab("counter", sessionStorage);

    expect(store.getSnapshot()).toEqual({ count: 9 });
  });
});
