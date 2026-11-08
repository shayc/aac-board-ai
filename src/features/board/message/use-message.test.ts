import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
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

    result.current.replaceWithText(text, "en");
    await rerender();

    expect(result.current.parts.map((part) => part.label)).toEqual(labels);
    expect(result.current.text).toBe(text);
  });

  test("clears all existing parts when called with an empty string", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("existing", "en");
    await rerender();

    result.current.replaceWithText("", "en");
    await rerender();

    expect(result.current.parts).toHaveLength(0);
  });

  test("gives each word the language of the text", async () => {
    const { result } = await renderHook(() => useMessage());

    result.current.replaceWithText("hola amigo", "es");

    expect(result.current.getParts().map((part) => part.language)).toEqual([
      "es",
      "es",
    ]);
  });

  test("exposes each edit to handlers before the next render", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water", "en");
    message.backspace();

    expect(message.getParts().map((part) => part.label)).toEqual([
      "I",
      "want",
      "wate",
    ]);
  });
});
