import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { setClearsAfterSpeaking } from "./message-preferences-store";
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

  test("applies each edit to the latest message before the next render", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    message.backspace();

    expect(spellLetter(message)).toEqual(["I", "want", "watea"]);
  });

  test("leaves the last suggested word open for spelling", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want");

    expect(spellLetter(message)).toEqual(["I", "wanta"]);
  });

  test("starts a new message once the message plays to its end", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);

    expect(spellLetter(message)).toEqual(["a"]);
  });

  test("keeps adding to a spoken message once it is edited", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);
    message.backspace();

    expect(spellLetter(message)).toEqual(["I", "want", "watea"]);
  });

  test("keeps adding to a played message when clearing after speaking is off", async () => {
    setClearsAfterSpeaking(false);
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);

    expect(spellLetter(message)).toEqual(["I", "want", "watera"]);
  });

  test("releases a spoken message when clearing after speaking is turned off", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("I want water");
    await trackSettledPlayback(result.current, true);
    setClearsAfterSpeaking(false);
    await rerender();

    expect(spellLetter(result.current)).toEqual(["I", "want", "watera"]);
  });

  test("keeps adding to the message when its playback did not complete", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);
    await trackSettledPlayback(message, false);

    expect(spellLetter(message)).toEqual(["I", "want", "watera"]);
  });

  test("keeps adding to a spoken message while it is playing again", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    await trackSettledPlayback(message, true);
    message.trackPlayback(Promise.withResolvers<boolean>().promise);

    expect(spellLetter(message)).toEqual(["I", "want", "watera"]);
  });

  test("keeps adding to the message when it changed while playing", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water");
    const completion = Promise.resolve(true);
    message.trackPlayback(completion);
    message.backspace();
    await completion;

    expect(spellLetter(message)).toEqual(["I", "want", "watea"]);
  });

  test("keeps adding to the message when its last word was reopened while playing", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.edit([{ kind: "spell", text: "hi" }, { kind: "space" }]);
    const completion = Promise.resolve(true);
    message.trackPlayback(completion);
    message.backspace();
    await completion;

    expect(spellLetter(message)).toEqual(["hia"]);
  });

  test("reports whether an edit changed the message", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("hi");

    expect(message.edit([{ kind: "space" }]).hasChanged).toBe(true);
    expect(message.edit([{ kind: "space" }]).hasChanged).toBe(false);
  });

  describe("editIfUnchanged", () => {
    test("edits the message it was given", async () => {
      const { result } = await renderHook(() => useMessage());
      const message = result.current;
      const { edited } = message.edit([{ kind: "spell", text: "hi" }]);

      message.editIfUnchanged(edited, [{ kind: "clear" }]);

      expect(spellLetter(message)).toEqual(["a"]);
    });

    test("continues a message that was spoken since", async () => {
      const { result } = await renderHook(() => useMessage());
      const message = result.current;
      const { edited } = message.edit([{ kind: "spell", text: "hi" }]);
      await trackSettledPlayback(message, true);

      message.editIfUnchanged(edited, [{ kind: "spell", text: "!" }]);

      expect(spellLetter(message)).toEqual(["hi!a"]);
    });

    test("drops the edits when the message changed since", async () => {
      const { result } = await renderHook(() => useMessage());
      const message = result.current;
      const { edited } = message.edit([{ kind: "spell", text: "hi" }]);
      message.backspace();

      message.editIfUnchanged(edited, [{ kind: "clear" }]);

      expect(spellLetter(message)).toEqual(["ha"]);
    });
  });
});

function spellLetter(message: ReturnType<typeof useMessage>): string[] {
  const { edited } = message.edit([{ kind: "spell", text: "a" }]);

  return edited.parts.map((part) => part.label);
}

async function trackSettledPlayback(
  message: ReturnType<typeof useMessage>,
  hasCompleted: boolean,
) {
  const completion = Promise.resolve(hasCompleted);
  message.trackPlayback(completion);
  await completion;
}
