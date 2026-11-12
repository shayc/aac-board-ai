import { describe, expect, test, vi } from "vitest";
import { createExternalStore, patchState } from "./external-store";

describe("createExternalStore", () => {
  test("notifies listeners on setState", () => {
    const store = createExternalStore(0);
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState(1);

    expect(listener).toHaveBeenCalledOnce();
  });

  test("applies an updater to the current state", () => {
    const store = createExternalStore({ count: 1, label: "a" });

    store.setState((current) => ({ ...current, count: current.count + 1 }));

    expect(store.getSnapshot()).toEqual({ count: 2, label: "a" });
  });

  test("patches the given fields and keeps the rest", () => {
    const store = createExternalStore({ count: 1, label: "a" });

    patchState(store, { count: 2 });

    expect(store.getSnapshot()).toEqual({ count: 2, label: "a" });
  });

  test("stops notifying after unsubscribe", () => {
    const store = createExternalStore(0);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState(1);

    expect(listener).not.toHaveBeenCalled();
  });
});
