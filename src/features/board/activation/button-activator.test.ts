import type { PlaybackOutcome } from "@shared/playback/playback-types";
import { assertDefined } from "@shared/testing/assert-defined";
import { describe, expect, test, vi } from "vitest";
import type { BoardButton } from "../board-types";
import type { MessagePart } from "../message/message-types";
import { createButtonActivator } from "./button-activator";

type ActivationOptions = Parameters<typeof createButtonActivator>[0];
type ActivationPlayback = ActivationOptions["playback"];

function setup(parts: MessagePart[] = []) {
  const message = {
    parts,
    setParts: vi.fn<(parts: MessagePart[]) => void>(),
  };
  const playback = {
    playMessage: vi.fn<ActivationPlayback["playMessage"]>(() =>
      Promise.resolve("completed"),
    ),
    playPart: vi.fn<ActivationPlayback["playPart"]>(() =>
      Promise.resolve("completed"),
    ),
  };
  const navigation = { goToBoard: vi.fn(), goHome: vi.fn() };
  const options: ActivationOptions = { message, playback, navigation };

  return {
    activateButton: createButtonActivator(options),
    message,
    playback,
    navigation,
  };
}

const SPEAK_THEN_CLEAR: BoardButton["actions"] = [
  { kind: "speak" },
  { kind: "clear" },
];

function holdMessagePlayback(playback: ReturnType<typeof setup>["playback"]) {
  const { promise, resolve } = Promise.withResolvers<PlaybackOutcome>();
  playback.playMessage.mockReturnValue(promise);

  return async (outcome: PlaybackOutcome) => {
    resolve(outcome);
    await promise;
  };
}

describe("createButtonActivator", () => {
  test("navigates to a linked board without running its actions or composing", () => {
    const { activateButton, message, playback, navigation } = setup();

    activateButton({
      id: "btn",
      label: "Folder",
      actions: [{ kind: "clear" }, { kind: "speak" }],
      linkedBoardId: "child-board",
    });

    expect(navigation.goToBoard).toHaveBeenCalledWith("child-board");
    expect(message.setParts).not.toHaveBeenCalled();
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

    expect(message.setParts).toHaveBeenCalledOnce();
    const [[committed]] = message.setParts.mock.calls;
    const appended = committed.at(-1);
    assertDefined(appended);
    expect(committed).toHaveLength(2);
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

  test("folds a mutation-only sequence into one commit without playing", () => {
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

    expect(message.setParts).toHaveBeenCalledOnce();
    const [[committed]] = message.setParts.mock.calls;
    expect(committed.map((part) => part.label)).toEqual(["hello", "world", ""]);
    expect(playback.playMessage).not.toHaveBeenCalled();
  });

  test("clear empties the message", () => {
    const { activateButton, message } = setup([{ id: "1", label: "hello" }]);

    activateButton({ id: "btn", label: "", actions: [{ kind: "clear" }] });

    expect(message.setParts).toHaveBeenCalledWith([]);
  });

  test("speaks a message that includes a letter spelled earlier in the same tap", () => {
    const { activateButton, message, playback } = setup();

    activateButton({
      id: "btn",
      label: "",
      actions: [{ kind: "spell", text: "s" }, { kind: "speak" }],
    });

    const [[spokenParts]] = playback.playMessage.mock.calls;
    expect(spokenParts.map((part) => part.label)).toEqual(["s"]);
    expect(message.setParts).toHaveBeenCalledExactlyOnceWith(spokenParts);
  });

  test("speaks the current message without committing when speak is the only action", async () => {
    const parts: MessagePart[] = [{ id: "1", label: "hi" }];
    const { activateButton, message, playback } = setup(parts);
    const settlePlayback = holdMessagePlayback(playback);

    activateButton({ id: "btn", label: "", actions: [{ kind: "speak" }] });
    await settlePlayback("completed");

    expect(playback.playMessage).toHaveBeenCalledWith(parts);
    expect(message.setParts).not.toHaveBeenCalled();
  });

  test("holds mutations after speak until playback completes, then commits them", async () => {
    const { activateButton, message, playback } = setup([
      { id: "1", label: "hi" },
    ]);
    const settlePlayback = holdMessagePlayback(playback);

    activateButton({ id: "btn", label: "", actions: SPEAK_THEN_CLEAR });
    expect(message.setParts).not.toHaveBeenCalled();

    await settlePlayback("completed");

    expect(message.setParts).toHaveBeenCalledExactlyOnceWith([]);
  });

  test("drops mutations after speak when playback is interrupted", async () => {
    const { activateButton, message, playback } = setup([
      { id: "1", label: "hi" },
    ]);
    const settlePlayback = holdMessagePlayback(playback);

    activateButton({ id: "btn", label: "", actions: SPEAK_THEN_CLEAR });
    await settlePlayback("interrupted");

    expect(message.setParts).not.toHaveBeenCalled();
  });
});
