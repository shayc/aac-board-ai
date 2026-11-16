import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { setMessageClearAfterPlayback } from "./message-preferences-store";
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

  test("gives each word of the replacement text its language", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("más agua", "es");
    await rerender();

    expect(result.current.parts).toMatchObject([
      { label: "más", language: "es" },
      { label: "agua", language: "es" },
    ]);
  });

  test("clears all existing parts when called with an empty string", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("existing", "en");
    await rerender();

    result.current.replaceWithText("", "en");
    await rerender();

    expect(result.current.parts).toHaveLength(0);
  });

  test("applies each edit to the latest message before the next render", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water", "en");
    message.backspace();

    expect(labelsAfterSpelling(message)).toEqual(["I", "want", "watea"]);
  });

  test("leaves the last suggested word open for spelling", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want", "en");

    expect(labelsAfterSpelling(message)).toEqual(["I", "wanta"]);
  });

  test("starts a new message once the message plays to its end", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await trackSettledPlayback(message, true);

    expect(labelsAfterSpelling(message)).toEqual(["a"]);
  });

  test("keeps adding to a played message once it is edited", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await trackSettledPlayback(message, true);
    message.backspace();

    expect(labelsAfterSpelling(message)).toEqual(["I", "want", "watea"]);
  });

  test("keeps adding to a played message when clearing after playing is off", async () => {
    setMessageClearAfterPlayback(false);
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await trackSettledPlayback(message, true);

    expect(labelsAfterSpelling(message)).toEqual(["I", "want", "watera"]);
  });

  test("releases a played message when clearing after playing is turned off", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("I want water", "en");
    await trackSettledPlayback(result.current, true);
    setMessageClearAfterPlayback(false);
    await rerender();

    expect(labelsAfterSpelling(result.current)).toEqual([
      "I",
      "want",
      "watera",
    ]);
  });

  test("keeps adding to the message when its playback did not complete", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await trackSettledPlayback(message, true);
    await trackSettledPlayback(message, false);

    expect(labelsAfterSpelling(message)).toEqual(["I", "want", "watera"]);
  });

  test("keeps adding to a played message while it is playing again", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await trackSettledPlayback(message, true);
    message.trackPlayback(Promise.withResolvers<boolean>().promise);

    expect(labelsAfterSpelling(message)).toEqual(["I", "want", "watera"]);
  });

  test("keeps adding to the message when it changed while playing", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("I want water", "en");
    const completion = Promise.resolve(true);
    message.trackPlayback(completion);
    message.backspace();
    await completion;

    expect(labelsAfterSpelling(message)).toEqual(["I", "want", "watea"]);
  });

  test("keeps adding to the message when its last word was reopened while playing", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.apply([
      { kind: "spell", text: "hi", language: "en" },
      { kind: "space" },
    ]);
    const completion = Promise.resolve(true);
    message.trackPlayback(completion);
    message.backspace();
    await completion;

    expect(labelsAfterSpelling(message)).toEqual(["hia"]);
  });

  test("reports whether an edit changed the message", async () => {
    const { result } = await renderHook(() => useMessage());
    const message = result.current;

    message.replaceWithText("hi", "en");

    expect(message.apply([{ kind: "space" }]).hasChanged).toBe(true);
    expect(message.apply([{ kind: "space" }]).hasChanged).toBe(false);
  });

  // A no-op edit, such as a tile that only plays, must not save a released
  // copy of a played message while clearing after playing is off.
  test("keeps a played message played through an edit that changes nothing", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.replaceWithText("I want water", "en");
    await trackSettledPlayback(result.current, true);
    setMessageClearAfterPlayback(false);
    await rerender();
    result.current.apply([]);
    setMessageClearAfterPlayback(true);
    await rerender();

    expect(labelsAfterSpelling(result.current)).toEqual(["a"]);
  });

  describe("undo", () => {
    test("restores a cleared message", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.replaceWithText("I want water", "en");
      result.current.clear();
      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("I want water");
    });

    test("steps back through one change at a time", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.replaceWithText("hi", "en");
      result.current.backspace();
      result.current.backspace();
      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("h");

      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("hi");
    });

    test("restores a message that a suggestion replaced", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.replaceWithText("I want", "en");
      result.current.replaceWithText("I want water please", "en");
      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("I want");
    });

    test("does not count playing the message as a change", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.replaceWithText("hi", "en");
      result.current.backspace();
      await trackSettledPlayback(result.current, true);
      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("hi");
    });

    test("does not count clearing an empty message", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.replaceWithText("h", "en");
      result.current.backspace();
      result.current.clear();
      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("h");
    });

    test("keeps the last 100 changes", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      const changeCount = 101;
      for (let change = 0; change < changeCount; change++) {
        result.current.apply([{ kind: "spell", text: "a", language: "en" }]);
      }

      for (let step = 0; step < changeCount; step++) {
        result.current.undo();
      }
      await rerender();

      expect(result.current.text).toBe("a");
    });

    test("opens a played message it brings back for more", async () => {
      const { result } = await renderHook(() => useMessage());
      const message = result.current;

      message.replaceWithText("hi", "en");
      await trackSettledPlayback(message, true);
      message.clear();
      message.undo();

      expect(labelsAfterSpelling(message)).toEqual(["hia"]);
    });

    test("leaves the message as it is with nothing to undo", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.undo();
      await rerender();

      expect(result.current.parts).toHaveLength(0);
    });
  });

  describe("applyIfUnchanged", () => {
    test("edits the message it was given", async () => {
      const { result } = await renderHook(() => useMessage());
      const message = result.current;
      const { edited } = message.apply([
        { kind: "spell", text: "hi", language: "en" },
      ]);

      message.applyIfUnchanged(edited, [{ kind: "clear" }]);

      expect(labelsAfterSpelling(message)).toEqual(["a"]);
    });

    test("continues a message that has played since", async () => {
      const { result } = await renderHook(() => useMessage());
      const message = result.current;
      const { edited } = message.apply([
        { kind: "spell", text: "hi", language: "en" },
      ]);
      await trackSettledPlayback(message, true);

      message.applyIfUnchanged(edited, [
        { kind: "spell", text: "!", language: "en" },
      ]);

      expect(labelsAfterSpelling(message)).toEqual(["hi!a"]);
    });

    test("drops the edits when the message changed since", async () => {
      const { result } = await renderHook(() => useMessage());
      const message = result.current;
      const { edited } = message.apply([
        { kind: "spell", text: "hi", language: "en" },
      ]);
      message.backspace();

      message.applyIfUnchanged(edited, [{ kind: "clear" }]);

      expect(labelsAfterSpelling(message)).toEqual(["ha"]);
    });
  });
});

function labelsAfterSpelling(message: ReturnType<typeof useMessage>): string[] {
  const { edited } = message.apply([
    { kind: "spell", text: "a", language: "en" },
  ]);

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
