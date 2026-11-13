import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { setStartsNewMessageAfterSpeaking } from "./message-preferences-store";
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

  test("exposes each edit to handlers before the next render", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    message.backspace();

    expect(message.getParts().map((part) => part.label)).toEqual([
      "I",
      "want",
      "wate",
    ]);
  });

  test("adds to an empty message once the current one is spoken", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    message.recordPlayback(message.getParts(), true);

    expect(message.getPartsToAddTo()).toEqual([]);
    expect(message.getParts()).toHaveLength(3);
  });

  test("adds to the spoken message once it is edited", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    message.recordPlayback(message.getParts(), true);
    message.backspace();

    expect(message.getPartsToAddTo()).toBe(message.getParts());
  });

  test("adds to the spoken message when starting a new message is off", async () => {
    setStartsNewMessageAfterSpeaking(false);
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    message.recordPlayback(message.getParts(), true);

    expect(message.getPartsToAddTo()).toBe(message.getParts());
  });

  test("adds to the message when its playback did not complete", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    message.recordPlayback(message.getParts(), true);
    message.recordPlayback(message.getParts(), false);

    expect(message.getPartsToAddTo()).toBe(message.getParts());
  });

  test("adds to the message when it changed while playing", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    const playedParts = message.getParts();
    message.backspace();
    message.recordPlayback(playedParts, true);

    expect(message.getPartsToAddTo()).toBe(message.getParts());
  });
});
