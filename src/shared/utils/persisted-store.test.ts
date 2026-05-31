import { beforeEach, describe, expect, test } from "vitest";
import { createPersistedStore } from "./persisted-store";

interface Counter {
  count: number;
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

  test("falls back to parse(undefined) on malformed JSON", () => {
    localStorage.setItem("counter", "{ not json");

    const store = createPersistedStore("counter", parseCounter);

    expect(store.getSnapshot()).toEqual({ count: 0 });
  });

  test("writes the snapshot back to localStorage on setState", () => {
    const store = createPersistedStore("counter", parseCounter);

    store.setState({ count: 9 });

    expect(localStorage.getItem("counter")).toBe(JSON.stringify({ count: 9 }));
  });
});
