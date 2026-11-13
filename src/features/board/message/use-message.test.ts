import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { appendText, EMPTY_MESSAGE } from "./message-transforms";
import { useMessage } from "./use-message";

describe("useMessage", () => {
  test.each([
    {
      description: "builds text from multiple parts joined by spaces",
      text: "I want water",
      labels: ["I", "want", "water"],
    },
    {
      description:
        "keeps trailing punctuation attached to its word for TTS prosody",
      text: "How are you?",
      labels: ["How", "are", "you?"],
    },
    {
      description: "attaches commas and periods to the preceding word",
      text: "Hello, world.",
      labels: ["Hello,", "world."],
    },
    {
      description: "keeps hyphenated and abbreviated words whole",
      text: "a well-being U.S.A. day",
      labels: ["a", "well-being", "U.S.A.", "day"],
    },
  ])("$description", async ({ text, labels }) => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText(text);
    await rerender();

    expect(result.current.parts.map((part) => part.label)).toEqual(labels);
    expect(result.current.text).toBe(text);
  });

  test("clears all existing parts when called with an empty string", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("existing");
    await rerender();

    result.current.replaceWithText("");
    await rerender();

    expect(result.current.parts).toHaveLength(0);
  });

  test("lists the open word after the finished parts", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("I want");
    result.current.setCurrent(appendText(result.current.getCurrent(), "t"));
    result.current.setCurrent(appendText(result.current.getCurrent(), "ea"));
    await rerender();

    expect(result.current.parts.map((part) => part.label)).toEqual([
      "I",
      "want",
      "tea",
    ]);
    expect(result.current.text).toBe("I want tea");
  });

  test("removes one letter at a time from the open word", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setCurrent(appendText(EMPTY_MESSAGE, "tea"));
    result.current.backspace();
    await rerender();

    expect(result.current.text).toBe("te");
  });

  test("exposes each edit to handlers before the next render", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    message.backspace();

    const labels = message.getCurrent().parts.map((part) => part.label);

    expect(labels).toEqual(["I", "want", "wate"]);
  });
});
