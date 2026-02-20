import { describe, expect, it, vi } from "vitest";
import { createExternalStore } from "./external-store";

describe("createExternalStore", () => {
  it("should return the initial state", () => {
    const store = createExternalStore(42);
    expect(store.getSnapshot()).toBe(42);
    expect(store.getState()).toBe(42);
  });

  it("should update state with setState", () => {
    const store = createExternalStore("hello");
    store.setState("world");
    expect(store.getSnapshot()).toBe("world");
    expect(store.getState()).toBe("world");
  });

  it("should notify listeners on setState", () => {
    const store = createExternalStore(0);
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState(1);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("should stop notifying after unsubscribe", () => {
    const store = createExternalStore(0);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should support object state", () => {
    const store = createExternalStore({ count: 0, label: "test" });
    store.setState({ count: 1, label: "updated" });
    expect(store.getSnapshot()).toEqual({ count: 1, label: "updated" });
  });
});
