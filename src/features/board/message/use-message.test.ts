import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useMessage } from "./use-message";

describe("useMessage", () => {
  test("builds text from multiple parts joined by spaces", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("I want water");
    await rerender();

    expect(result.current.parts).toHaveLength(3);
    expect(result.current.text).toBe("I want water");
  });

  test("mints a distinct id for each part even with identical content", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("cat cat");
    await rerender();

    const [first, second] = result.current.parts;
    expect(first.id).toBeTruthy();
    expect(second.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });

  test("removes a single character from the last-added text-only part", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("hello world");
    await rerender();

    result.current.removeLastPart();
    await rerender();

    expect(result.current.parts).toHaveLength(2);
    expect(result.current.text).toBe("hello worl");
  });

  test("keeps trailing punctuation attached to its word for TTS prosody", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("How are you?");
    await rerender();

    expect(result.current.parts.map((part) => part.label)).toEqual([
      "How",
      "are",
      "you?",
    ]);
    expect(result.current.text).toBe("How are you?");
  });

  test("attaches commas and periods to the preceding word", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("Hello, world.");
    await rerender();

    expect(result.current.parts.map((part) => part.label)).toEqual([
      "Hello,",
      "world.",
    ]);
  });

  test("keeps hyphenated and abbreviated words whole", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("a well-being U.S.A. day");
    await rerender();

    expect(result.current.parts.map((part) => part.label)).toEqual([
      "a",
      "well-being",
      "U.S.A.",
      "day",
    ]);
  });

  test("clears all existing parts when called with an empty string", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("existing");
    await rerender();

    result.current.setFromText("");
    await rerender();

    expect(result.current.parts).toHaveLength(0);
  });

  test("setParts replaces the parts wholesale", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("existing");
    await rerender();

    result.current.setParts([{ id: "1", label: "replaced" }]);
    await rerender();

    expect(result.current.parts).toEqual([{ id: "1", label: "replaced" }]);
  });
});
