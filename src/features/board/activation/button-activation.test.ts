import type { PlaybackOutcome } from "@shared/playback/playback-context";
import { describe, expect, test, vi } from "vitest";
import type { MessagePart } from "../message/message-types";
import type { BoardButton } from "../types";
import { createButtonActivator } from "./button-activation";

type ActivationOptions = Parameters<typeof createButtonActivator>[0];

function createMessageStub(
  parts: MessagePart[] = [],
): ActivationOptions["message"] {
  return {
    parts,
    setParts: vi.fn(),
  };
}

function createPlaybackStub(): ActivationOptions["playback"] {
  return {
    playMessage: vi.fn((): Promise<PlaybackOutcome> =>
      Promise.resolve("completed"),
    ),
    playPart: vi.fn((): Promise<PlaybackOutcome> =>
      Promise.resolve("completed"),
    ),
  };
}

function createNavigationStub(): ActivationOptions["navigation"] {
  return {
    goToBoard: vi.fn(),
    goHome: vi.fn(),
  };
}

type SetupOptions = Partial<ActivationOptions>;

function setup(opts: SetupOptions = {}) {
  const message = opts.message ?? createMessageStub();
  const playback = opts.playback ?? createPlaybackStub();
  const navigation = opts.navigation ?? createNavigationStub();

  const activateButton = createButtonActivator({
    message,
    playback,
    navigation,
  });

  return { activateButton, message, playback, navigation };
}

describe("createButtonActivator", () => {
  test("navigates to the linked board and skips message and audio when loadBoard.id is set", () => {
    const { activateButton, message, playback, navigation } = setup();

    const button: BoardButton = {
      id: "btn",
      label: "Folder",
      loadBoard: { id: "child-board" },
    };

    activateButton(button);

    expect(navigation.goToBoard).toHaveBeenCalledWith("child-board");
    expect(message.setParts).not.toHaveBeenCalled();
    expect(playback.playMessage).not.toHaveBeenCalled();
    expect(playback.playPart).not.toHaveBeenCalled();
  });

  test("maps home to navigation.goHome", () => {
    const { activateButton, navigation } = setup();

    activateButton({ id: "btn", actions: [{ kind: "home" }] });

    expect(navigation.goHome).toHaveBeenCalledTimes(1);
  });

  test("spell appends the text via setParts", () => {
    const message = createMessageStub([]);
    const { activateButton } = setup({ message });

    activateButton({
      id: "btn",
      actions: [{ kind: "spell", text: "t" }],
    });

    expect(message.setParts).toHaveBeenCalledTimes(1);
    const [committed] = vi.mocked(message.setParts).mock.calls[0];
    expect(committed).toHaveLength(1);
    expect(committed[0].label).toBe("t");
    expect(committed[0].id).toBeTruthy();
  });

  test("space appends an empty-label part via setParts", () => {
    const message = createMessageStub([]);
    const { activateButton } = setup({ message });

    activateButton({ id: "btn", actions: [{ kind: "space" }] });

    expect(message.setParts).toHaveBeenCalledTimes(1);
    const [committed] = vi.mocked(message.setParts).mock.calls[0];
    expect(committed).toHaveLength(1);
    expect(committed[0].label).toBe("");
    expect(committed[0].id).toBeTruthy();
  });

  test("backspace removes a character from a text-only last part via setParts", () => {
    const message = createMessageStub([
      { id: "1", label: "hello" },
      { id: "2", label: "world" },
    ]);
    const { activateButton } = setup({ message });

    activateButton({ id: "btn", actions: [{ kind: "backspace" }] });

    expect(message.setParts).toHaveBeenCalledWith([
      { id: "1", label: "hello" },
      { id: "2", label: "worl" },
    ]);
  });

  test("clear empties the message via setParts", () => {
    const message = createMessageStub([{ id: "1", label: "hello" }]);
    const { activateButton } = setup({ message });

    activateButton({ id: "btn", actions: [{ kind: "clear" }] });

    expect(message.setParts).toHaveBeenCalledWith([]);
  });

  test("spelling then speaking speaks a message that includes the spelled letter", () => {
    const message = createMessageStub([]);
    const playback = createPlaybackStub();
    const { activateButton } = setup({ message, playback });

    activateButton({
      id: "btn",
      actions: [{ kind: "spell", text: "s" }, { kind: "speak" }],
    });

    expect(playback.playMessage).toHaveBeenCalledTimes(1);
    const [spokenParts] = vi.mocked(playback.playMessage).mock.calls[0];
    expect(spokenParts).toHaveLength(1);
    expect(spokenParts[0].label).toBe("s");
    expect(spokenParts[0].id).toBeTruthy();
    expect(message.setParts).toHaveBeenCalledWith(spokenParts);
  });

  test("speaking then clearing keeps the message until playback ends, then commits the clear", async () => {
    const initialParts: MessagePart[] = [{ id: "1", label: "hi" }];
    const message = createMessageStub(initialParts);
    const playback = createPlaybackStub();
    let resolvePlay: (() => void) | undefined;
    playback.playMessage = vi.fn(
      () =>
        new Promise<"completed">((resolve) => {
          resolvePlay = () => resolve("completed");
        }),
    );
    const { activateButton } = setup({ message, playback });

    activateButton({
      id: "btn",
      actions: [{ kind: "speak" }, { kind: "clear" }],
    });

    expect(playback.playMessage).toHaveBeenCalledWith(initialParts);
    expect(message.setParts).not.toHaveBeenCalled();

    resolvePlay?.();
    await vi.waitFor(() => {
      expect(message.setParts).toHaveBeenCalledWith([]);
    });
  });

  test("does not apply post-speak mutations when playback is interrupted", async () => {
    const initialParts: MessagePart[] = [{ id: "1", label: "hi" }];
    const message = createMessageStub(initialParts);
    const playback = createPlaybackStub();
    playback.playMessage = vi.fn((): Promise<PlaybackOutcome> =>
      Promise.resolve("interrupted"),
    );
    const { activateButton } = setup({ message, playback });

    activateButton({
      id: "btn",
      actions: [{ kind: "speak" }, { kind: "clear" }],
    });
    await Promise.resolve();

    expect(message.setParts).not.toHaveBeenCalled();
  });

  test("a mutation-only sequence folds every mutation into one commit and never plays", () => {
    const message = createMessageStub([]);
    const playback = createPlaybackStub();
    const { activateButton } = setup({ message, playback });

    activateButton({
      id: "btn",
      actions: [
        { kind: "spell", text: "h" },
        { kind: "spell", text: "i" },
        { kind: "space" },
      ],
    });

    expect(message.setParts).toHaveBeenCalledTimes(1);
    const [committed] = vi.mocked(message.setParts).mock.calls[0];
    expect(committed.map((part) => part.label)).toEqual(["hi", ""]);
    expect(playback.playMessage).not.toHaveBeenCalled();
  });

  test("a speak-only sequence plays without committing any parts", async () => {
    const initialParts: MessagePart[] = [{ id: "1", label: "hi" }];
    const message = createMessageStub(initialParts);
    const playback = createPlaybackStub();
    const { activateButton } = setup({ message, playback });

    activateButton({ id: "btn", actions: [{ kind: "speak" }] });

    expect(playback.playMessage).toHaveBeenCalledWith(initialParts);

    await Promise.resolve();

    expect(message.setParts).not.toHaveBeenCalled();
  });

  test("treats an empty actions array as no actions and speaks instead", () => {
    const { activateButton, message } = setup();

    activateButton({
      id: "btn",
      label: "hi",
      actions: [],
    });

    expect(message.setParts).toHaveBeenCalledTimes(1);
  });

  test("adds the button as a message part when there are no actions and no loadBoard", () => {
    const message = createMessageStub([]);
    const { activateButton } = setup({ message });

    activateButton({
      id: "btn",
      label: "hi",
      vocalization: "hello",
      imageSrc: "img.png",
    });

    expect(message.setParts).toHaveBeenCalledTimes(1);
    const [committed] = vi.mocked(message.setParts).mock.calls[0];
    expect(committed).toHaveLength(1);
    expect(committed[0]).toMatchObject({
      label: "hi",
      vocalization: "hello",
      imageSrc: "img.png",
    });
    expect(committed[0].id).toBeTruthy();
  });

  test("passes the composed sound part to playback", () => {
    const { activateButton, playback } = setup();

    activateButton({
      id: "btn",
      label: "bell",
      soundSrc: "bell.mp3",
    });

    expect(playback.playPart).toHaveBeenCalledTimes(1);
    expect(playback.playPart).toHaveBeenCalledWith(
      expect.objectContaining({ label: "bell", soundSrc: "bell.mp3" }),
    );
  });

  test("passes vocalization to playback without handling speech mechanics", () => {
    const { activateButton, playback } = setup();

    activateButton({
      id: "btn",
      label: "I",
      vocalization: "Hello",
    });

    expect(playback.playPart).toHaveBeenCalledWith(
      expect.objectContaining({ label: "I", vocalization: "Hello" }),
    );
  });

  test("passes label-only content to playback", () => {
    const { activateButton, playback } = setup();

    activateButton({ id: "btn", label: "Goodbye" });

    expect(playback.playPart).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Goodbye" }),
    );
  });

  test("delegates inaudible content so playback policy stays centralized", () => {
    const { activateButton, message, playback } = setup();

    activateButton({ id: "btn" });

    expect(message.setParts).toHaveBeenCalledTimes(1);
    expect(playback.playPart).toHaveBeenCalledTimes(1);
  });
});
