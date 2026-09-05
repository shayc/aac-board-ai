import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useMessage } from "./use-message";

describe("useMessage", () => {
  test("builds text from multiple parts joined by spaces", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("I want water");
    await rerender();

    expect(result.current.parts).toHaveLength(3);
    expect(result.current.text).toBe("I want water");
  });

  test("keeps trailing punctuation attached to its word for TTS prosody", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("How are you?");
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

    result.current.replaceWithText("Hello, world.");
    await rerender();

    expect(result.current.parts.map((part) => part.label)).toEqual([
      "Hello,",
      "world.",
    ]);
  });

  test("keeps hyphenated and abbreviated words whole", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("a well-being U.S.A. day");
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

    result.current.replaceWithText("existing");
    await rerender();

    result.current.replaceWithText("");
    await rerender();

    expect(result.current.parts).toHaveLength(0);
  });
});
