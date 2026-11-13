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

  test("stores a function as the state instead of calling it", () => {
    const greet = () => "hello";
    const store = createExternalStore<() => string>(() => "initial");

    store.setState(greet);

    expect(store.getSnapshot()).toBe(greet);
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
