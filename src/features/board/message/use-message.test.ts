import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { setClearsAfterSpeaking } from "./message-preferences-store";
import { closeWord, spell } from "./message-transforms";
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

    expect(message.getState().parts.map((part) => part.label)).toEqual([
      "I",
      "want",
      "wate",
    ]);
  });

  test("leaves the last suggested word open for spelling", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want");
    message.setState(spell(message.getState(), "s"));

    expect(message.getState().parts.map((part) => part.label)).toEqual([
      "I",
      "wants",
    ]);
  });

  test("marks the message spoken once it plays to its end", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);

    expect(message.getState().isSpoken).toBe(true);
    expect(message.getState().parts).toHaveLength(3);
  });

  test("leaves the message unspoken once it is edited", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);
    message.backspace();

    expect(message.getState().isSpoken).toBe(false);
  });

  test("leaves the message unspoken when clearing after speaking is off", async () => {
    setClearsAfterSpeaking(false);
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);

    expect(message.getState().isSpoken).toBe(false);
  });

  test("leaves the message unspoken when its playback did not complete", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);
    await trackSettledPlayback(message, false);

    expect(message.getState().isSpoken).toBe(false);
  });

  test("leaves a spoken message unspoken while it is playing again", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);
    message.trackPlayback(Promise.withResolvers<boolean>().promise);

    expect(message.getState().isSpoken).toBe(false);
  });

  test("leaves the message unspoken when it changed while playing", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    const completion = Promise.resolve(true);
    message.trackPlayback(completion);
    message.backspace();
    await completion;

    expect(message.getState().isSpoken).toBe(false);
  });

  test("leaves the message unspoken when its last word was reopened while playing", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.setState(closeWord(spell(message.getState(), "hi")));
    const completion = Promise.resolve(true);
    message.trackPlayback(completion);
    message.backspace();
    await completion;

    expect(message.getState()).toMatchObject({
      isWordOpen: true,
      isSpoken: false,
    });
  });
});

async function trackSettledPlayback(
  message: ReturnType<typeof useMessage>,
  hasCompleted: boolean,
) {
  const completion = Promise.resolve(hasCompleted);
  message.trackPlayback(completion);
  await completion;
}
