import { describe, expect, test, vi } from "vitest";
import { createExternalStore } from "./external-store";

describe("createExternalStore", () => {
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
});
