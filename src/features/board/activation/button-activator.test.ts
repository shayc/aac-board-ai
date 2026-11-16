import type { BoardButton } from "@features/library";
import { assertDefined } from "@shared/testing/assert-defined";
import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { setClearsAfterSpeaking } from "../message/message-preferences-store";
import { createTilePart } from "../message/message-transforms";
import type { MessageEdit } from "../message/message-types";
import { useMessage } from "../message/use-message";
import { createButtonActivator } from "./button-activator";

type ActivationOptions = Parameters<typeof createButtonActivator>[0];

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
  { isSpoken = false, language = "en" } = {},
) {
  const { result, rerender } = await renderHook(() => useMessage());
  const message = result.current;
  message.apply(seed);
  if (isSpoken) {
    const spoken = Promise.resolve(true);
    message.trackPlayback(spoken);
    await spoken;
  }

  // Like the board's playback, playing the message reports it to the message
  // so it can be marked spoken.
  const playback = {
    playMessage: vi.fn<ActivationOptions["playback"]["playMessage"]>(() => {
      const completion = Promise.resolve(true);
      message.trackPlayback(completion);

      return completion;
    }),
    echoMessage: vi.fn<ActivationOptions["playback"]["echoMessage"]>(() =>
      Promise.resolve(true),
    ),
    playPart: vi.fn<ActivationOptions["playback"]["playPart"]>(() =>
      Promise.resolve(),
    ),
  };
  const navigation = { goToBoard: vi.fn(), goHome: vi.fn() };

  async function readParts() {
    await rerender();

    return result.current.parts;
  }

  async function readLabels() {
    const parts = await readParts();

    return parts.map((part) => part.label);
  }

  function holdMessagePlayback() {
    const { promise, resolve } = Promise.withResolvers<boolean>();
    playback.playMessage.mockImplementation(() => {
      message.trackPlayback(promise);

      return promise;
    });

    return async (hasCompleted: boolean) => {
      resolve(hasCompleted);
      await promise;
    };
  }

  return {
    activateButton: createButtonActivator({
      message,
      playback,
      navigation,
      language,
    }),
    playback,
    navigation,
    readParts,
    readLabels,
    holdMessagePlayback,
  };
}

describe("createButtonActivator", () => {
  test("navigates to a linked board without running its actions or composing", async () => {
    const { activateButton, playback, navigation, readLabels } = await setup(
      word("hi"),
    );

    activateButton({
      id: "btn",
      label: "Folder",
      actions: [{ kind: "clear" }, { kind: "play" }],
      linkedBoardId: "child-board",
    });

    expect(navigation.goToBoard).toHaveBeenCalledWith("child-board");
    expect(await readLabels()).toEqual(["hi"]);
    expect(playback.playMessage).not.toHaveBeenCalled();
    expect(playback.playPart).not.toHaveBeenCalled();
  });

  test("appends a button without actions to the message and plays that part", async () => {
    const { activateButton, playback, readParts } = await setup(word("I"));

    activateButton({
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
    expect(playback.playPart).toHaveBeenCalledExactlyOnceWith(appended);
    expect(playback.playMessage).not.toHaveBeenCalled();
  });

  test("gives tiles and spelled words the board's language", async () => {
    const { activateButton, readParts } = await setup([], { language: "es" });

    activateButton({ id: "btn", label: "hola", actions: [] });
    activateButton(SPELL_A);

    const parts = await readParts();
    expect(parts).toMatchObject([
      { kind: "tile", label: "hola", language: "es" },
      { kind: "text", label: "a", language: "es" },
    ]);
  });

  test("navigates home for a home action", async () => {
    const { activateButton, navigation } = await setup();

    activateButton({ id: "btn", label: "", actions: [{ kind: "home" }] });

    expect(navigation.goHome).toHaveBeenCalledOnce();
  });

  test("applies an edit-only sequence in order without playing", async () => {
    const { activateButton, playback, readLabels } = await setup([
      ...word("hello"),
      ...word("world"),
    ]);

    activateButton({
      id: "btn",
      label: "",
      actions: [
        { kind: "backspace" },
        { kind: "backspace" },
        { kind: "spell", text: "d" },
        { kind: "space" },
        { kind: "spell", text: "s" },
      ],
    });

    expect(await readLabels()).toEqual(["hello", "world", "s"]);
    expect(playback.playMessage).not.toHaveBeenCalled();
  });

  test("clear empties the message", async () => {
    const { activateButton, readLabels } = await setup(word("hello"));

    activateButton({ id: "btn", label: "", actions: [{ kind: "clear" }] });

    expect(await readLabels()).toEqual([]);
  });

  test("echoes a message that includes a letter spelled earlier in the same tap", async () => {
    const { activateButton, playback, readParts } = await setup();

    activateButton({
      id: "btn",
      label: "",
      actions: [{ kind: "spell", text: "s" }, { kind: "play" }],
    });

    const partsToPlay = playback.echoMessage.mock.calls[0]?.[0];
    assertDefined(partsToPlay);

    const parts = await readParts();
    expect(parts.map((part) => part.label)).toEqual(["s"]);
    expect(partsToPlay).toBe(parts);
    expect(playback.playMessage).not.toHaveBeenCalled();
  });

  test("plays the current message as it stands when play is the only action", async () => {
    const { activateButton, playback, readParts } = await setup(word("hi"));
    const parts = await readParts();

    activateButton({ id: "btn", label: "", actions: [{ kind: "play" }] });

    expect(playback.playMessage).toHaveBeenCalledExactlyOnceWith(parts);
    expect(playback.echoMessage).not.toHaveBeenCalled();
  });

  test("holds edits after play until playback completes, then applies them", async () => {
    const { activateButton, readLabels, holdMessagePlayback } = await setup(
      word("hi"),
    );
    const settlePlayback = holdMessagePlayback();

    activateButton({ id: "btn", label: "", actions: PLAY_THEN_CLEAR });
    expect(await readLabels()).toEqual(["hi"]);

    await settlePlayback(true);

    expect(await readLabels()).toEqual([]);
  });

  test("drops edits after play when the message was edited during playback", async () => {
    const { activateButton, readLabels, holdMessagePlayback } = await setup(
      word("hi"),
    );
    const settlePlayback = holdMessagePlayback();

    activateButton({ id: "btn", label: "", actions: PLAY_THEN_CLEAR });
    activateButton(SPELL_A);
    await settlePlayback(true);

    expect(await readLabels()).toEqual(["hi", "a"]);
  });

  test("keeps the message spoken when an edit after play changes nothing", async () => {
    const { activateButton, readLabels, holdMessagePlayback } = await setup([
      tilePart("hi"),
    ]);
    const settlePlayback = holdMessagePlayback();

    activateButton({
      id: "btn",
      label: "",
      actions: [{ kind: "play" }, { kind: "space" }],
    });
    await settlePlayback(true);
    activateButton(SPELL_A);

    expect(await readLabels()).toEqual(["a"]);
  });

  test("applies edits after play to the message it has just spoken", async () => {
    const { activateButton, readLabels, holdMessagePlayback } = await setup(
      word("hi"),
    );
    const settlePlayback = holdMessagePlayback();

    activateButton({
      id: "btn",
      label: "",
      actions: [{ kind: "play" }, { kind: "spell", text: "!" }],
    });
    await settlePlayback(true);

    expect(await readLabels()).toEqual(["hi", "!"]);
  });

  test("closes the word being spelled when space follows play", async () => {
    const { activateButton, playback, readLabels } = await setup();

    activateButton({
      id: "btn",
      label: "",
      actions: [
        { kind: "spell", text: "a" },
        { kind: "play" },
        { kind: "space" },
      ],
    });
    const echo = playback.echoMessage.mock.results[0];
    assertDefined(echo);
    await echo.value;
    activateButton({
      id: "btn",
      label: "",
      actions: [{ kind: "spell", text: "b" }],
    });

    expect(await readLabels()).toEqual(["a", "b"]);
  });

  test("drops edits after play when playback does not complete", async () => {
    const { activateButton, readLabels, holdMessagePlayback } = await setup(
      word("hi"),
    );
    const settlePlayback = holdMessagePlayback();

    activateButton({ id: "btn", label: "", actions: PLAY_THEN_CLEAR });
    await settlePlayback(false);

    expect(await readLabels()).toEqual(["hi"]);
  });

  test("speaks the message for a space that changes nothing, followed by play", async () => {
    const { activateButton, playback } = await setup([tilePart("hello")]);

    activateButton({
      id: "btn",
      label: "",
      actions: [{ kind: "space" }, { kind: "play" }],
    });

    expect(playback.playMessage).toHaveBeenCalledOnce();
    expect(playback.echoMessage).not.toHaveBeenCalled();
  });

  describe("after the message is spoken", () => {
    const SPOKEN_PARTS = [tilePart("hello"), tilePart("world")];

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
      const { activateButton, readLabels } = await setup(SPOKEN_PARTS, {
        isSpoken: true,
      });

      activateButton(button);

      expect(await readLabels()).toEqual(labels);
    });

    test("edits the spoken message with backspace", async () => {
      const { activateButton, readLabels } = await setup(SPOKEN_PARTS, {
        isSpoken: true,
      });

      activateButton({
        id: "btn",
        label: "",
        actions: [{ kind: "backspace" }],
      });

      expect(await readLabels()).toEqual(["hello"]);
    });

    test("leaves the spoken message as it is for a space", async () => {
      const { activateButton, readLabels } = await setup(SPOKEN_PARTS, {
        isSpoken: true,
      });

      activateButton({ id: "btn", label: "", actions: [{ kind: "space" }] });
      activateButton(SPELL_A);

      expect(await readLabels()).toEqual(["a"]);
    });

    test("speaks the message again for a space followed by play", async () => {
      const { activateButton, playback, readParts } = await setup(
        SPOKEN_PARTS,
        { isSpoken: true },
      );
      const parts = await readParts();

      activateButton({
        id: "btn",
        label: "",
        actions: [{ kind: "space" }, { kind: "play" }],
      });

      expect(playback.playMessage).toHaveBeenCalledExactlyOnceWith(parts);
      expect(playback.echoMessage).not.toHaveBeenCalled();
    });

    // While clearing after speaking is off, the message hook releases a
    // spoken message each time it is edited, which must not count as a change.
    test("replays a spoken message when clearing after speaking is off", async () => {
      setClearsAfterSpeaking(false);
      const { activateButton, playback } = await setup(SPOKEN_PARTS, {
        isSpoken: true,
      });

      activateButton({ id: "btn", label: "", actions: [{ kind: "play" }] });

      expect(playback.playMessage).toHaveBeenCalledOnce();
      expect(playback.echoMessage).not.toHaveBeenCalled();
    });
  });
});
