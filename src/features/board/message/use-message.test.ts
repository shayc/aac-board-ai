import { getAssetURL } from "@features/library";
import {
  loadTestImageAsset,
  makeAssetInput,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
import { assertDefined } from "@shared/testing/assert-defined";
import { assert, beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { createTilePart, EMPTY_MESSAGE, type TilePart } from "./message";
import { restoreMessageDraft } from "./message-draft";
import { setMessageClearAfterPlayback } from "./message-preferences-store";
import { type PlayMessage, useMessage } from "./use-message";

const MEDIA_BOARD_SET_ID = "media-set";
const IMAGE_PATH = "images/hello.png";
const SOUND_PATH = "sounds/hello.wav";
const REMOTE_SOUND_SRC = "https://example.com/hello.mp3";

const playMessage = vi.fn<PlayMessage>();

describe("useMessage", () => {
  beforeEach(() => {
    playMessage.mockReset().mockResolvedValue(true);
  });

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
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );

    result.current.replaceWithText(text, "en");
    await rerender();

    expect(result.current.parts.map((part) => part.label)).toEqual(labels);
    expect(result.current.text).toBe(text);
  });

  test("gives each word of the replacement text its language", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );

    result.current.replaceWithText("más agua", "es");
    await rerender();

    expect(result.current.parts).toMatchObject([
      { label: "más", language: "es" },
      { label: "agua", language: "es" },
    ]);
  });

  test("clears all existing parts when called with an empty string", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );

    result.current.replaceWithText("existing", "en");
    await rerender();

    result.current.replaceWithText("", "en");
    await rerender();

    expect(result.current.parts).toHaveLength(0);
  });

  test("applies each edit to the latest message before the next render", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );
    const message = result.current;

    message.replaceWithText("I want water", "en");
    message.backspace();

    expect(await labelsAfterSpelling(result, rerender)).toEqual([
      "I",
      "want",
      "watea",
    ]);
  });

  test("leaves the last suggested word open for spelling", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );
    const message = result.current;

    message.replaceWithText("I want", "en");

    expect(await labelsAfterSpelling(result, rerender)).toEqual(["I", "wanta"]);
  });

  test("starts a new message once the message plays to its end", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await playToCompletion(message, true);

    expect(await labelsAfterSpelling(result, rerender)).toEqual(["a"]);
  });

  test("keeps adding to a played message once it is edited", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await playToCompletion(message, true);
    message.backspace();

    expect(await labelsAfterSpelling(result, rerender)).toEqual([
      "I",
      "want",
      "watea",
    ]);
  });

  test("keeps adding to a played message when clearing after playing is off", async () => {
    setMessageClearAfterPlayback(false);
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await playToCompletion(message, true);

    expect(await labelsAfterSpelling(result, rerender)).toEqual([
      "I",
      "want",
      "watera",
    ]);
  });

  test("releases a played message when clearing after playing is turned off", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );

    result.current.replaceWithText("I want water", "en");
    await playToCompletion(result.current, true);
    setMessageClearAfterPlayback(false);
    await rerender();

    expect(await labelsAfterSpelling(result, rerender)).toEqual([
      "I",
      "want",
      "watera",
    ]);
  });

  test("keeps adding to the message when its playback did not complete", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await playToCompletion(message, true);
    await playToCompletion(message, false);

    expect(await labelsAfterSpelling(result, rerender)).toEqual([
      "I",
      "want",
      "watera",
    ]);
  });

  test("keeps adding to a played message while it is playing again", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );
    const message = result.current;

    message.replaceWithText("I want water", "en");
    await playToCompletion(message, true);
    playMessage.mockReturnValueOnce(Promise.withResolvers<boolean>().promise);
    void message.play();

    expect(await labelsAfterSpelling(result, rerender)).toEqual([
      "I",
      "want",
      "watera",
    ]);
  });

  test("keeps adding to the message when it changed while playing", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );
    const message = result.current;

    message.replaceWithText("I want water", "en");
    const playing = message.play();
    message.backspace();
    await playing;

    expect(await labelsAfterSpelling(result, rerender)).toEqual([
      "I",
      "want",
      "watea",
    ]);
  });

  test("keeps adding to the message when its last word was reopened while playing", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );
    const message = result.current;

    message.apply([
      { kind: "spell", text: "hi", language: "en" },
      { kind: "space" },
    ]);
    const playing = message.play();
    message.backspace();
    await playing;

    expect(await labelsAfterSpelling(result, rerender)).toEqual(["hia"]);
  });

  test("reports whether an edit changed the message", async () => {
    const { result } = await renderHook(() => useMessage(playMessage));
    const message = result.current;

    message.replaceWithText("hi", "en");

    expect(message.apply([{ kind: "space" }])).toBe(true);
    expect(message.apply([{ kind: "space" }])).toBe(false);
  });

  test("keeps a played message played through an edit that changes nothing", async () => {
    const { result, rerender } = await renderHook(() =>
      useMessage(playMessage),
    );

    result.current.replaceWithText("I want water", "en");
    await playToCompletion(result.current, true);
    setMessageClearAfterPlayback(false);
    await rerender();
    result.current.apply([]);
    setMessageClearAfterPlayback(true);
    await rerender();

    expect(await labelsAfterSpelling(result, rerender)).toEqual(["a"]);
  });

  describe("undo", () => {
    test("restores a cleared message", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );

      result.current.replaceWithText("I want water", "en");
      result.current.clear();
      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("I want water");
    });

    test("steps back through one change at a time", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );

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
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );

      result.current.replaceWithText("I want", "en");
      result.current.replaceWithText("I want water please", "en");
      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("I want");
    });

    test("does not count playing the message as a change", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );

      result.current.replaceWithText("hi", "en");
      result.current.backspace();
      await playToCompletion(result.current, true);
      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("hi");
    });

    test("does not count clearing an empty message", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );

      result.current.replaceWithText("h", "en");
      result.current.backspace();
      result.current.clear();
      result.current.undo();
      await rerender();

      expect(result.current.text).toBe("h");
    });

    test("keeps the last 100 changes", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );

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
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );
      const message = result.current;

      message.replaceWithText("hi", "en");
      await playToCompletion(message, true);
      message.clear();
      message.undo();

      expect(await labelsAfterSpelling(result, rerender)).toEqual(["hia"]);
    });

    test("leaves the message as it is with nothing to undo", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );

      result.current.undo();
      await rerender();

      expect(result.current.parts).toHaveLength(0);
    });
  });

  describe("echo", () => {
    test("plays the message and leaves it open for more", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );
      const message = result.current;
      message.apply([{ kind: "spell", text: "hi", language: "en" }]);

      await message.echo([]);

      expect(playMessage).toHaveBeenCalledOnce();
      expect(await labelsAfterSpelling(result, rerender)).toEqual(["hia"]);
    });

    test("applies the edits that follow once it has played", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );
      const message = result.current;
      message.apply([{ kind: "spell", text: "hi", language: "en" }]);

      await message.echo([{ kind: "clear" }]);

      expect(await labelsAfterSpelling(result, rerender)).toEqual(["a"]);
    });

    test("continues a message that has played", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );
      const message = result.current;
      message.apply([{ kind: "spell", text: "hi", language: "en" }]);
      await playToCompletion(message, true);

      await message.echo([{ kind: "spell", text: "!", language: "en" }]);

      expect(await labelsAfterSpelling(result, rerender)).toEqual(["hi!a"]);
    });

    test("drops the edits when the message changed meanwhile", async () => {
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );
      const message = result.current;
      message.apply([{ kind: "spell", text: "hi", language: "en" }]);
      const echo = message.echo([{ kind: "clear" }]);
      message.backspace();

      await echo;

      expect(await labelsAfterSpelling(result, rerender)).toEqual(["ha"]);
    });

    test("drops the edits when it does not play to its end", async () => {
      playMessage.mockResolvedValue(false);
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage),
      );
      const message = result.current;
      message.apply([{ kind: "spell", text: "hi", language: "en" }]);

      await message.echo([{ kind: "clear" }]);

      expect(await labelsAfterSpelling(result, rerender)).toEqual(["hia"]);
    });
  });

  describe("draft", () => {
    beforeEach(resetBoardsDB);

    test("restores the message when it opens again", async () => {
      const first = await renderHook(() => useMessage(playMessage));
      first.result.current.replaceWithText("I want", "en");
      await first.rerender();
      const saved = first.result.current.parts;
      await first.unmount();

      const restored = await restoreMessageDraft();
      const { result } = await renderHook(() =>
        useMessage(playMessage, restored),
      );

      expect(result.current.parts).toEqual(saved);
    });

    test("keeps no draft of a played message the next symbol replaces", async () => {
      const { result } = await renderHook(() => useMessage(playMessage));
      result.current.replaceWithText("I want", "en");

      await playToCompletion(result.current, true);

      expect(await restoreMessageDraft()).toBe(EMPTY_MESSAGE);
    });

    test("restores a played message when clearing after playing is off", async () => {
      setMessageClearAfterPlayback(false);
      const first = await renderHook(() => useMessage(playMessage));
      first.result.current.replaceWithText("I want", "en");
      await playToCompletion(first.result.current, true);
      await first.unmount();

      const restored = await restoreMessageDraft();
      const { result, rerender } = await renderHook(() =>
        useMessage(playMessage, restored),
      );

      expect(restored.hasPlayed).toBe(true);
      expect(await labelsAfterSpelling(result, rerender)).toEqual([
        "I",
        "wanta",
      ]);
    });

    test("saves no draft once the message is cleared", async () => {
      const { result } = await renderHook(() => useMessage(playMessage));
      result.current.replaceWithText("I want", "en");

      result.current.clear();

      expect(await restoreMessageDraft()).toBe(EMPTY_MESSAGE);
    });

    test("brings back stored symbols and sounds after a reload", async () => {
      await seedMediaBoardSet();
      const imageSrc = await requireAssetURL(IMAGE_PATH);
      const soundSrc = await requireAssetURL(SOUND_PATH);
      await composeAndClose({ imageSrc, soundSrc });
      // Storing the set again revokes its URLs, as closing the page would.
      await resetBoardsDB();
      await seedMediaBoardSet();

      const part = await renderRestoredTilePart();

      assert(part.imageSrc && part.soundSrc);
      expect(part.imageSrc).not.toBe(imageSrc);
      expect(part.soundSrc).not.toBe(soundSrc);
      expect(await readText(part.soundSrc)).toBe("recording");
      expect((await fetch(part.imageSrc)).ok).toBe(true);
    });

    test("keeps media that are not stored beside stored ones", async () => {
      await seedMediaBoardSet();
      const imageSrc = await requireAssetURL(IMAGE_PATH);
      await composeAndClose({ imageSrc, soundSrc: REMOTE_SOUND_SRC });

      const part = await renderRestoredTilePart();

      expect(part.imageSrc).toBe(imageSrc);
      expect(part.soundSrc).toBe(REMOTE_SOUND_SRC);
    });
  });
});

async function labelsAfterSpelling(
  result: { current: ReturnType<typeof useMessage> },
  rerender: () => Promise<void>,
): Promise<string[]> {
  result.current.apply([{ kind: "spell", text: "a", language: "en" }]);
  await rerender();

  return result.current.parts.map((part) => part.label);
}

async function playToCompletion(
  message: ReturnType<typeof useMessage>,
  hasCompleted: boolean,
) {
  playMessage.mockResolvedValueOnce(hasCompleted);
  await message.play();
}

async function seedMediaBoardSet() {
  await seedBoardSets([
    {
      id: MEDIA_BOARD_SET_ID,
      rootBoardId: "home",
      assets: [
        await loadTestImageAsset(IMAGE_PATH),
        makeAssetInput(SOUND_PATH, "recording"),
      ],
    },
  ]);
}

async function requireAssetURL(path: string): Promise<string> {
  const url = await getAssetURL({ boardSetId: MEDIA_BOARD_SET_ID, path });
  assertDefined(url);

  return url;
}

async function composeAndClose(media: {
  imageSrc?: string;
  soundSrc?: string;
}) {
  const { result, unmount } = await renderHook(() => useMessage(playMessage));
  result.current.apply([
    {
      kind: "tile",
      part: createTilePart({ label: "hello", language: "en", ...media }),
    },
  ]);
  await unmount();
}

async function renderRestoredTilePart(): Promise<TilePart> {
  const restored = await restoreMessageDraft();
  const { result } = await renderHook(() => useMessage(playMessage, restored));
  const part = result.current.parts[0];
  assert(part?.kind === "tile");

  return part;
}

async function readText(url: string): Promise<string> {
  const response = await fetch(url);

  return response.text();
}
