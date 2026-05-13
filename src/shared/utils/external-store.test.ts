import { describe, expect, test, vi } from "vitest";
import { createExternalStore } from "./external-store";

describe("createExternalStore", () => {
  test("returns the initial state", () => {
    const store = createExternalStore(42);
    expect(store.getSnapshot()).toBe(42);
  });

  test("updates state with setState", () => {
    const store = createExternalStore("hello");
    store.setState("world");
    expect(store.getSnapshot()).toBe("world");
  });

  test("notifies listeners on setState", () => {
    const store = createExternalStore(0);
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState(1);
    expect(listener).toHaveBeenCalledOnce();
  });

  test("stops notifying after unsubscribe", () => {
    const store = createExternalStore(0);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState(1);
    expect(listener).not.toHaveBeenCalled();
  });

  test("supports object state", () => {
    const store = createExternalStore({ count: 0, label: "test" });
    store.setState({ count: 1, label: "updated" });
    expect(store.getSnapshot()).toEqual({ count: 1, label: "updated" });
  });
});
