import type { BoardButton } from "@features/library";
import { assertDefined } from "@shared/testing/assert-defined";
import { describe, expect, test, vi } from "vitest";
import {
  EMPTY_MESSAGE,
  finishedMessage,
  messageParts,
} from "../message/message-transforms";
import type { Message, MessagePart } from "../message/message-types";
import { createButtonActivator } from "./button-activator";

type ActivationOptions = Parameters<typeof createButtonActivator>[0];

const PLAY_THEN_CLEAR: BoardButton["actions"] = [
  { kind: "play" },
  { kind: "clear" },
];

function setup(initialParts: readonly MessagePart[] = []) {
  let current = finishedMessage(initialParts);
  const message = {
    getCurrent: () => current,
    setCurrent: vi.fn<ActivationOptions["message"]["setCurrent"]>((next) => {
      current = next;
    }),
  };
  const playback = {
    playMessage: vi.fn<ActivationOptions["playback"]["playMessage"]>(() =>
      Promise.resolve(true),
    ),
    playPart: vi.fn<ActivationOptions["playback"]["playPart"]>(() =>
      Promise.resolve(),
    ),
  };
  const navigation = { goToBoard: vi.fn(), goHome: vi.fn() };

  return {
    activateButton: createButtonActivator({ message, playback, navigation }),
    message,
    playback,
    navigation,
  };
}

function labels(message: Message): string[] {
  return messageParts(message).map((part) => part.label);
}

function holdMessagePlayback(playback: ReturnType<typeof setup>["playback"]) {
  const { promise, resolve } = Promise.withResolvers<boolean>();
  playback.playMessage.mockReturnValue(promise);

  return async (hasCompleted: boolean) => {
    resolve(hasCompleted);
    await promise;
  };
}

describe("createButtonActivator", () => {
  test("navigates to a linked board without running its actions or composing", () => {
    const { activateButton, message, playback, navigation } = setup();

    activateButton({
      id: "btn",
      label: "Folder",
      actions: [{ kind: "clear" }, { kind: "play" }],
      linkedBoardId: "child-board",
    });

    expect(navigation.goToBoard).toHaveBeenCalledWith("child-board");
    expect(message.setCurrent).not.toHaveBeenCalled();
    expect(playback.playMessage).not.toHaveBeenCalled();
    expect(playback.playPart).not.toHaveBeenCalled();
  });

  test("appends a button without actions to the message and plays that part", () => {
    const { activateButton, message, playback } = setup([
      { id: "1", label: "I" },
    ]);

    activateButton({
      id: "btn",
      label: "bell",
      vocalization: "ring the bell",
      imageSrc: "bell.png",
      soundSrc: "bell.mp3",
      actions: [],
    });

    expect(message.setCurrent).toHaveBeenCalledOnce();
    const committed = message.setCurrent.mock.calls[0]?.[0];
    assertDefined(committed);
    const appended = committed.finishedParts.at(-1);
    assertDefined(appended);
    expect(committed.finishedParts).toHaveLength(2);
    expect(committed.openWord).toBeNull();
    expect(appended).toMatchObject({
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

  test("navigates home for a home action", () => {
    const { activateButton, navigation } = setup();

    activateButton({ id: "btn", label: "", actions: [{ kind: "home" }] });

    expect(navigation.goHome).toHaveBeenCalledOnce();
  });

  test("folds an edit-only sequence into one commit without playing", () => {
    const { activateButton, message, playback } = setup([
      { id: "1", label: "hello" },
      { id: "2", label: "world" },
    ]);

    activateButton({
      id: "btn",
      label: "",
      actions: [
        { kind: "backspace" },
        { kind: "spell", text: "d" },
        { kind: "space" },
      ],
    });

    expect(message.setCurrent).toHaveBeenCalledOnce();
    const committed = message.setCurrent.mock.calls[0]?.[0];
    assertDefined(committed);
    expect(committed.openWord).toBeNull();
    expect(labels(committed)).toEqual(["hello", "d"]);
    expect(playback.playMessage).not.toHaveBeenCalled();
  });

  test("spells a new word after a word tile instead of extending it", () => {
    const { activateButton, message } = setup();

    activateButton({ id: "word", label: "the", actions: [] });
    activateButton({
      id: "letter",
      label: "C",
      actions: [{ kind: "spell", text: "c" }],
    });

    const committed = message.setCurrent.mock.lastCall?.[0];
    assertDefined(committed);
    expect(labels(committed)).toEqual(["the", "c"]);
  });

  test("clear empties the message", () => {
    const { activateButton, message } = setup([{ id: "1", label: "hello" }]);

    activateButton({ id: "btn", label: "", actions: [{ kind: "clear" }] });

    expect(message.setCurrent).toHaveBeenCalledWith(EMPTY_MESSAGE);
  });

  test("plays a message that includes a letter spelled earlier in the same tap", () => {
    const { activateButton, message, playback } = setup();

    activateButton({
      id: "btn",
      label: "",
      actions: [{ kind: "spell", text: "s" }, { kind: "play" }],
    });

    const partsToPlay = playback.playMessage.mock.calls[0]?.[0];
    assertDefined(partsToPlay);

    expect(partsToPlay.map((part) => part.label)).toEqual(["s"]);
    expect(message.setCurrent).toHaveBeenCalledExactlyOnceWith({
      finishedParts: [],
      openWord: partsToPlay[0],
    });
  });

  test("plays the current message without committing when play is the only action", async () => {
    const parts: MessagePart[] = [{ id: "1", label: "hi" }];
    const { activateButton, message, playback } = setup(parts);
    const settlePlayback = holdMessagePlayback(playback);

    activateButton({ id: "btn", label: "", actions: [{ kind: "play" }] });
    await settlePlayback(true);

    expect(playback.playMessage).toHaveBeenCalledWith(parts);
    expect(message.setCurrent).not.toHaveBeenCalled();
  });

  test("holds edits after play until playback completes, then commits them", async () => {
    const { activateButton, message, playback } = setup([
      { id: "1", label: "hi" },
    ]);
    const settlePlayback = holdMessagePlayback(playback);

    activateButton({ id: "btn", label: "", actions: PLAY_THEN_CLEAR });
    expect(message.setCurrent).not.toHaveBeenCalled();

    await settlePlayback(true);

    expect(message.setCurrent).toHaveBeenCalledExactlyOnceWith(EMPTY_MESSAGE);
  });

  test("applies edits after play to the message as it is when playback completes", async () => {
    const { activateButton, message, playback } = setup([
      { id: "1", label: "hi" },
    ]);
    const settlePlayback = holdMessagePlayback(playback);

    activateButton({
      id: "btn",
      label: "",
      actions: [{ kind: "play" }, { kind: "spell", text: "!" }],
    });
    message.setCurrent(
      finishedMessage([
        { id: "1", label: "hi" },
        { id: "2", label: "there" },
      ]),
    );
    await settlePlayback(true);

    const committed = message.setCurrent.mock.lastCall?.[0];
    assertDefined(committed);
    expect(labels(committed)).toEqual(["hi", "there", "!"]);
  });

  test("drops edits after play when playback does not complete", async () => {
    const { activateButton, message, playback } = setup([
      { id: "1", label: "hi" },
    ]);
    const settlePlayback = holdMessagePlayback(playback);

    activateButton({ id: "btn", label: "", actions: PLAY_THEN_CLEAR });
    await settlePlayback(false);

    expect(message.setCurrent).not.toHaveBeenCalled();
  });
});
