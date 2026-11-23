import type { BoardButton } from "@features/library";
import { assertDefined } from "@shared/testing/assert-defined";
import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { createTilePart, type MessageEdit } from "./message/message";
import { setMessageClearAfterPlayback } from "./message/message-preferences-store";
import { type PlayParts, useMessage } from "./message/use-message";
import { createTileActivator } from "./tile-activation";

type ActivationOptions = Parameters<typeof createTileActivator>[0];

const PLAY_THEN_CLEAR: BoardButton["actions"] = [
  { kind: "play" },
  { kind: "clear" },
];

const SPELL_A: BoardButton = {
  id: "btn",
  label: "",
  actions: [{ kind: "spell", text: "a" }],
};

function tilePart(label: string): MessageEdit {
  return { kind: "tile", part: createTilePart({ label, language: "en" }) };
}

function word(label: string): MessageEdit[] {
  return [{ kind: "spell", text: label, language: "en" }, { kind: "space" }];
}

async function setup(
  seed: readonly MessageEdit[] = [],
  { hasPlayed = false, boardLanguage = "en", shouldPlayTiles = true } = {},
) {
  const playback = {
    playParts: vi.fn<PlayParts>(() => Promise.resolve(true)),
    playTile: vi.fn<ActivationOptions["playback"]["playTile"]>(() =>
      Promise.resolve(),
    ),
    stop: vi.fn<ActivationOptions["playback"]["stop"]>(),
  };
  const { result, rerender } = await renderHook(() =>
    useMessage(playback.playParts),
  );
  const message = result.current;
  message.apply(seed);
  if (hasPlayed) {
    await message.play();
    playback.playParts.mockClear();
  }

  const navigation = { goToBoard: vi.fn(), goHome: vi.fn() };

  async function readParts() {
    await rerender();

    return result.current.parts;
  }

  async function readLabels() {
    const parts = await readParts();

    return parts.map((part) => part.label);
  }

  async function playbackSettled() {
    await rerender();
  }

  function holdMessagePlayback() {
    const { promise, resolve } = Promise.withResolvers<boolean>();
    playback.playParts.mockImplementation(() => promise);

    return async (hasCompleted: boolean) => {
      resolve(hasCompleted);
      await playbackSettled();
    };
  }

  return {
    activateTile: createTileActivator({
      message,
      playback: { playTile: playback.playTile, stop: playback.stop },
      navigation,
      boardLanguage,
      shouldPlayTiles,
    }),
    playback,
    navigation,
    readParts,
    readLabels,
    playbackSettled,
    holdMessagePlayback,
  };
}

describe("createTileActivator", () => {
  test("navigates to a linked board without running its actions or composing", async () => {
    const { activateTile, playback, navigation, readLabels } = await setup(
      word("hi"),
    );

    activateTile({
      id: "btn",
      label: "Folder",
      actions: [{ kind: "clear" }, { kind: "play" }],
      linkedBoardId: "child-board",
    });

    expect(navigation.goToBoard).toHaveBeenCalledWith("child-board");
    expect(await readLabels()).toEqual(["hi"]);
    expect(playback.playParts).not.toHaveBeenCalled();
    expect(playback.playTile).not.toHaveBeenCalled();
  });

  test("appends a button without actions to the message and plays that part", async () => {
    const { activateTile, playback, readParts } = await setup(word("I"));

    activateTile({
      id: "btn",
      label: "bell",
      vocalization: "ring the bell",
      imageSrc: "bell.png",
      soundSrc: "bell.mp3",
      actions: [],
    });

    const parts = await readParts();
    expect(parts.map((part) => part.label)).toEqual(["I", "bell"]);
    const appended = parts.at(-1);
    assertDefined(appended);
    expect(appended).toMatchObject({
      kind: "tile",
      label: "bell",
      vocalization: "ring the bell",
      imageSrc: "bell.png",
      soundSrc: "bell.mp3",
    });
    expect(appended.id).toBeTruthy();
    expect(appended.id).not.toBe("btn");
    expect(playback.playTile).toHaveBeenCalledExactlyOnceWith(appended);
    expect(playback.playParts).not.toHaveBeenCalled();
  });

  test("appends a button without actions silently, stopping playback, when tiles are not played", async () => {
    const { activateTile, playback, readLabels } = await setup([], {
      shouldPlayTiles: false,
    });

    activateTile({ id: "btn", label: "bell", actions: [] });

    expect(await readLabels()).toEqual(["bell"]);
    expect(playback.playTile).not.toHaveBeenCalled();
    expect(playback.stop).toHaveBeenCalledOnce();
  });

  test("spells without echoing, stopping playback, when tiles are not played", async () => {
    const { activateTile, playback, readLabels } = await setup([], {
      shouldPlayTiles: false,
    });

    activateTile({
      id: "btn",
      label: "",
      actions: [
        { kind: "spell", text: "a" },
        { kind: "play" },
        { kind: "clear" },
      ],
    });

    expect(await readLabels()).toEqual([]);
    expect(playback.playParts).not.toHaveBeenCalled();
    expect(playback.stop).toHaveBeenCalledOnce();
  });

  test("still plays the message for a play action when tiles are not played", async () => {
    const { activateTile, playback } = await setup(word("hi"), {
      shouldPlayTiles: false,
    });

    activateTile({ id: "btn", label: "", actions: [{ kind: "play" }] });

    expect(playback.playParts).toHaveBeenCalledOnce();
  });

  test("gives tiles and spelled words the board's language", async () => {
    const { activateTile, readParts } = await setup([], {
      boardLanguage: "es",
    });

    activateTile({ id: "btn", label: "hola", actions: [] });
    activateTile(SPELL_A);

    const parts = await readParts();
    expect(parts).toMatchObject([
      { kind: "tile", label: "hola", language: "es" },
      { kind: "text", label: "a", language: "es" },
    ]);
  });

  test("navigates home for a home action", async () => {
    const { activateTile, navigation } = await setup();

    activateTile({ id: "btn", label: "", actions: [{ kind: "home" }] });

    expect(navigation.goHome).toHaveBeenCalledOnce();
  });

  test("applies supported edits in order and skips unsupported actions", async () => {
    const { activateTile, playback, readLabels } = await setup([
      ...word("hello"),
      ...word("world"),
    ]);

    activateTile({
      id: "btn",
      label: "",
      actions: [
        { kind: "backspace" },
        { kind: "unsupported", raw: ":shift" },
        { kind: "backspace" },
        { kind: "spell", text: "d" },
        { kind: "space" },
        { kind: "spell", text: "s" },
      ],
    });

    expect(await readLabels()).toEqual(["hello", "world", "s"]);
    expect(playback.playParts).not.toHaveBeenCalled();
  });

  test("empties the message for a clear action", async () => {
    const { activateTile, readLabels } = await setup(word("hello"));

    activateTile({ id: "btn", label: "", actions: [{ kind: "clear" }] });

    expect(await readLabels()).toEqual([]);
  });

  test("echoes a message that includes a letter spelled earlier in the same tap", async () => {
    const { activateTile, playback, readParts } = await setup();

    activateTile({
      id: "btn",
      label: "",
      actions: [{ kind: "spell", text: "s" }, { kind: "play" }],
    });

    const partsToPlay = playback.playParts.mock.calls[0]?.[0];
    assertDefined(partsToPlay);

    const parts = await readParts();
    expect(parts.map((part) => part.label)).toEqual(["s"]);
    expect(partsToPlay).toBe(parts);
  });

  test("keeps adding to a message once its echo has played", async () => {
    const { activateTile, readLabels, playbackSettled } = await setup();

    activateTile({
      id: "btn",
      label: "",
      actions: [{ kind: "spell", text: "s" }, { kind: "play" }],
    });
    await playbackSettled();
    activateTile(SPELL_A);

    expect(await readLabels()).toEqual(["sa"]);
  });

  test("plays the current message as it stands when play is the only action", async () => {
    const { activateTile, playback, readParts } = await setup(word("hi"));
    const parts = await readParts();

    activateTile({ id: "btn", label: "", actions: [{ kind: "play" }] });

    expect(playback.playParts).toHaveBeenCalledExactlyOnceWith(parts);
  });

  test("holds edits after play until playback completes, then applies them", async () => {
    const { activateTile, readLabels, holdMessagePlayback } = await setup(
      word("hi"),
    );
    const settlePlayback = holdMessagePlayback();

    activateTile({ id: "btn", label: "", actions: PLAY_THEN_CLEAR });
    expect(await readLabels()).toEqual(["hi"]);

    await settlePlayback(true);

    expect(await readLabels()).toEqual([]);
  });

  test("drops edits after play when the message was edited during playback", async () => {
    const { activateTile, readLabels, holdMessagePlayback } = await setup(
      word("hi"),
    );
    const settlePlayback = holdMessagePlayback();

    activateTile({ id: "btn", label: "", actions: PLAY_THEN_CLEAR });
    activateTile(SPELL_A);
    await settlePlayback(true);

    expect(await readLabels()).toEqual(["hi", "a"]);
  });

  test("keeps the message played when an edit after play changes nothing", async () => {
    const { activateTile, readLabels, holdMessagePlayback } = await setup([
      tilePart("hi"),
    ]);
    const settlePlayback = holdMessagePlayback();

    activateTile({
      id: "btn",
      label: "",
      actions: [{ kind: "play" }, { kind: "space" }],
    });
    await settlePlayback(true);
    activateTile(SPELL_A);

    expect(await readLabels()).toEqual(["a"]);
  });

  test("applies edits after play to the message it has just played", async () => {
    const { activateTile, readLabels, holdMessagePlayback } = await setup(
      word("hi"),
    );
    const settlePlayback = holdMessagePlayback();

    activateTile({
      id: "btn",
      label: "",
      actions: [{ kind: "play" }, { kind: "spell", text: "!" }],
    });
    await settlePlayback(true);

    expect(await readLabels()).toEqual(["hi", "!"]);
  });

  test("closes the word being spelled when space follows play", async () => {
    const { activateTile, readLabels, playbackSettled } = await setup();

    activateTile({
      id: "btn",
      label: "",
      actions: [
        { kind: "spell", text: "a" },
        { kind: "play" },
        { kind: "space" },
      ],
    });
    await playbackSettled();
    activateTile({
      id: "btn",
      label: "",
      actions: [{ kind: "spell", text: "b" }],
    });

    expect(await readLabels()).toEqual(["a", "b"]);
  });

  test("drops edits after play when playback does not complete", async () => {
    const { activateTile, readLabels, holdMessagePlayback } = await setup(
      word("hi"),
    );
    const settlePlayback = holdMessagePlayback();

    activateTile({ id: "btn", label: "", actions: PLAY_THEN_CLEAR });
    await settlePlayback(false);

    expect(await readLabels()).toEqual(["hi"]);
  });

  test("counts the message as played for a space that changes nothing, followed by play", async () => {
    const { activateTile, playback, readLabels, playbackSettled } = await setup(
      [tilePart("hello")],
    );

    activateTile({
      id: "btn",
      label: "",
      actions: [{ kind: "space" }, { kind: "play" }],
    });
    await playbackSettled();
    activateTile(SPELL_A);

    expect(playback.playParts).toHaveBeenCalledOnce();
    expect(await readLabels()).toEqual(["a"]);
  });

  describe("after the message has played", () => {
    const PLAYED_PARTS = [tilePart("hello"), tilePart("world")];

    test.each<{ description: string; button: BoardButton; labels: string[] }>([
      {
        description: "a tile",
        button: { id: "btn", label: "bell", actions: [] },
        labels: ["bell"],
      },
      {
        description: "a spelled letter",
        button: SPELL_A,
        labels: ["a"],
      },
      {
        description: "a letter after a space",
        button: {
          id: "btn",
          label: "",
          actions: [{ kind: "space" }, { kind: "spell", text: "a" }],
        },
        labels: ["a"],
      },
    ])("starts a new message with $description", async ({ button, labels }) => {
      const { activateTile, readLabels } = await setup(PLAYED_PARTS, {
        hasPlayed: true,
      });

      activateTile(button);

      expect(await readLabels()).toEqual(labels);
    });

    test("edits the played message with backspace", async () => {
      const { activateTile, readLabels } = await setup(PLAYED_PARTS, {
        hasPlayed: true,
      });

      activateTile({
        id: "btn",
        label: "",
        actions: [{ kind: "backspace" }],
      });

      expect(await readLabels()).toEqual(["hello"]);
    });

    test("leaves the played message as it is for a space", async () => {
      const { activateTile, readLabels } = await setup(PLAYED_PARTS, {
        hasPlayed: true,
      });

      activateTile({ id: "btn", label: "", actions: [{ kind: "space" }] });
      activateTile(SPELL_A);

      expect(await readLabels()).toEqual(["a"]);
    });

    test("speaks the message again for a space followed by play", async () => {
      const { activateTile, playback, readParts } = await setup(PLAYED_PARTS, {
        hasPlayed: true,
      });
      const parts = await readParts();

      activateTile({
        id: "btn",
        label: "",
        actions: [{ kind: "space" }, { kind: "play" }],
      });

      expect(playback.playParts).toHaveBeenCalledExactlyOnceWith(parts);
    });

    // Clearing the played flag alone must still let the same message replay.
    test("replays a played message when clearing after playing is off", async () => {
      setMessageClearAfterPlayback(false);
      const { activateTile, playback } = await setup(PLAYED_PARTS, {
        hasPlayed: true,
      });

      activateTile({ id: "btn", label: "", actions: [{ kind: "play" }] });

      expect(playback.playParts).toHaveBeenCalledOnce();
    });
  });
});
