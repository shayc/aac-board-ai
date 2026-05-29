import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { usePersistentState } from "./use-persistent-state";

const KEY = "test-persistent-state";

describe("usePersistentState", () => {
  test("returns initial value when localStorage is empty", async () => {
    const { result } = await renderHook(() => usePersistentState(KEY, 42));

    expect(result.current[0]).toBe(42);
  });

  test("writes initial value to localStorage on first render", async () => {
    await renderHook(() => usePersistentState(KEY, "initial"));

    expect(JSON.parse(localStorage.getItem(KEY)!)).toBe("initial");
  });

  test("reads existing value from localStorage", async () => {
    localStorage.setItem(KEY, JSON.stringify("stored-value"));

    const { result } = await renderHook(() =>
      usePersistentState(KEY, "default"),
    );

    expect(result.current[0]).toBe("stored-value");
  });

  test("falls back to initial value when localStorage contains invalid JSON", async () => {
    localStorage.setItem(KEY, "not-valid-json{{{");

    const { result } = await renderHook(() =>
      usePersistentState(KEY, "fallback"),
    );

    expect(result.current[0]).toBe("fallback");
  });

  test("persists value to localStorage on update", async () => {
    const { result, rerender } = await renderHook(() =>
      usePersistentState(KEY, "initial"),
    );

    result.current[1]("updated");
    await rerender();

    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(localStorage.getItem(KEY)!)).toBe("updated");
  });

  test("supports functional updates", async () => {
    const { result, rerender } = await renderHook(() =>
      usePersistentState(KEY, 10),
    );

    result.current[1]((prev) => prev + 5);
    await rerender();

    expect(result.current[0]).toBe(15);
  });
});
