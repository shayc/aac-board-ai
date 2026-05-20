import { afterEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useMessage } from "./use-message";

const STORAGE_KEY = "message";

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
});

describe("useMessage", () => {
  test("builds text from multiple parts joined by spaces", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ id: "1", label: "I" });
    await rerender();
    result.current.addPart({ id: "2", label: "want" });
    await rerender();
    result.current.addPart({ id: "3", label: "water" });
    await rerender();

    expect(result.current.parts).toHaveLength(3);
    expect(result.current.text).toBe("I want water");
  });

  test("merges into existing last part preserving untouched fields", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ id: "1", label: "first" });
    await rerender();
    result.current.addPart({
      id: "2",
      label: "he",
      imageSrc: "img.png",
    });
    await rerender();

    result.current.updateLastPart({ id: "2", label: "hello" });
    await rerender();

    expect(result.current.parts).toHaveLength(2);
    expect(result.current.parts[0]).toEqual({ id: "1", label: "first" });
    expect(result.current.parts[1].label).toBe("hello");
    expect(result.current.parts[1].imageSrc).toBe("img.png");
  });

  test("inserts a new part as the first element when the message is empty", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.updateLastPart({ id: "1", label: "first" });
    await rerender();

    expect(result.current.parts).toHaveLength(1);
    expect(result.current.parts[0]).toEqual({ id: "1", label: "first" });
  });

  test("removes the last-added part", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ id: "1", label: "hello" });
    await rerender();
    result.current.addPart({ id: "2", label: "world" });
    await rerender();

    result.current.removeLastPart();
    await rerender();

    expect(result.current.parts).toHaveLength(1);
    expect(result.current.text).toBe("hello");
  });

  test("splits a text string into individual word parts", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("I want water");
    await rerender();

    expect(result.current.parts).toHaveLength(3);
    expect(result.current.text).toBe("I want water");
  });

  test("segments scripts without whitespace into word parts", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("我想喝水");
    await rerender();

    expect(result.current.parts.length).toBeGreaterThan(1);
    expect(result.current.parts.every((part) => part.label.length > 0)).toBe(
      true,
    );
  });

  test("clears all existing parts when called with an empty string", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ id: "1", label: "existing" });
    await rerender();

    result.current.setFromText("");
    await rerender();

    expect(result.current.parts).toHaveLength(0);
  });

  test("persists parts across unmount and remount", async () => {
    const first = await renderHook(() => useMessage());

    first.result.current.addPart({ id: "1", label: "hello" });
    await first.rerender();
    first.result.current.addPart({ id: "2", label: "world" });
    await first.rerender();

    await first.unmount();

    const second = await renderHook(() => useMessage());

    expect(second.result.current.parts).toHaveLength(2);
    expect(second.result.current.text).toBe("hello world");
  });
});
