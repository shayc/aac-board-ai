import { stubAudio, stubSpeech } from "@shared/testing/device-output";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { UseMessagePlaybackReturn } from "../message/playback/use-message-playback";
import type { MessagePart, UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { BoardButton } from "../types";
import { createButtonActivation } from "./button-activation";

function createMessageStub(parts: MessagePart[] = []): UseMessageReturn {
  return {
    parts,
    text: parts.map((p) => p.label ?? "").join(" "),
    setFromText: vi.fn(),
    removeLastPart: vi.fn(),
    setParts: vi.fn(),
    clear: vi.fn(),
  };
}

function createPlaybackStub(): UseMessagePlaybackReturn {
  return {
    isPlaying: false,
    activePartId: null,
    play: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
  };
}

function createNavigationStub(): UseBoardNavigationReturn {
  return {
    setId: "set-1",
    boardId: "board-1",
    canGoBack: false,
    canGoHome: true,
    isHome: false,
    goToBoard: vi.fn(),
    goBack: vi.fn(),
    goHome: vi.fn(),
  };
}

interface SetupOptions {
  message?: UseMessageReturn;
  playback?: UseMessagePlaybackReturn;
  navigation?: UseBoardNavigationReturn;
}

function setup(opts: SetupOptions = {}) {
  const message = opts.message ?? createMessageStub();
  const playback = opts.playback ?? createPlaybackStub();
  const navigation = opts.navigation ?? createNavigationStub();

  const activation = createButtonActivation({ message, playback, navigation });

  return { activation, message, playback, navigation };
}

describe("createButtonActivation", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  test("navigates to the linked board and skips message and audio when loadBoard.id is set", () => {
    const { activation, message, playback, navigation } = setup();

    const button: BoardButton = {
      id: "btn",
      label: "Folder",
      loadBoard: { id: "child-board" },
    };

    activation.activateButton(button);

    expect(navigation.goToBoard).toHaveBeenCalledWith("child-board");
    expect(message.setParts).not.toHaveBeenCalled();
    expect(playback.play).not.toHaveBeenCalled();
    expect(speech.speak).not.toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
  });

  test("maps home to navigation.goHome", () => {
    const { activation, navigation } = setup();

    activation.activateButton({ id: "btn", actions: [{ kind: "home" }] });

    expect(navigation.goHome).toHaveBeenCalledTimes(1);
  });

  test("spell appends the text via setParts", () => {
    const message = createMessageStub([]);
    const { activation } = setup({ message });

    activation.activateButton({
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
    const { activation } = setup({ message });

    activation.activateButton({ id: "btn", actions: [{ kind: "space" }] });

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
    const { activation } = setup({ message });

    activation.activateButton({ id: "btn", actions: [{ kind: "backspace" }] });

    expect(message.setParts).toHaveBeenCalledWith([
      { id: "1", label: "hello" },
      { id: "2", label: "worl" },
    ]);
  });

  test("clear empties the message via setParts", () => {
    const message = createMessageStub([{ id: "1", label: "hello" }]);
    const { activation } = setup({ message });

    activation.activateButton({ id: "btn", actions: [{ kind: "clear" }] });

    expect(message.setParts).toHaveBeenCalledWith([]);
  });

  test("spelling then speaking speaks a message that includes the spelled letter", () => {
    const message = createMessageStub([]);
    const playback = createPlaybackStub();
    const { activation } = setup({ message, playback });

    activation.activateButton({
      id: "btn",
      actions: [{ kind: "spell", text: "s" }, { kind: "speak" }],
    });

    expect(playback.play).toHaveBeenCalledTimes(1);
    const [spokenParts] = vi.mocked(playback.play).mock.calls[0];
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
    playback.play = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePlay = resolve;
        }),
    );
    const { activation } = setup({ message, playback });

    activation.activateButton({
      id: "btn",
      actions: [{ kind: "speak" }, { kind: "clear" }],
    });

    expect(playback.play).toHaveBeenCalledWith(initialParts);
    expect(message.setParts).not.toHaveBeenCalled();

    resolvePlay?.();
    await vi.waitFor(() => {
      expect(message.setParts).toHaveBeenCalledWith([]);
    });
  });

  test("a mutation-only sequence folds every mutation into one commit and never plays", () => {
    const message = createMessageStub([]);
    const playback = createPlaybackStub();
    const { activation } = setup({ message, playback });

    activation.activateButton({
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
    expect(playback.play).not.toHaveBeenCalled();
  });

  test("a speak-only sequence plays without committing any parts", async () => {
    const initialParts: MessagePart[] = [{ id: "1", label: "hi" }];
    const message = createMessageStub(initialParts);
    const playback = createPlaybackStub();
    const { activation } = setup({ message, playback });

    activation.activateButton({ id: "btn", actions: [{ kind: "speak" }] });

    expect(playback.play).toHaveBeenCalledWith(initialParts);

    await Promise.resolve();

    expect(message.setParts).not.toHaveBeenCalled();
  });

  test("treats a loadBoard without an id as not navigable and speaks instead", () => {
    const { activation, message, navigation } = setup();

    activation.activateButton({
      id: "btn",
      label: "hi",
      loadBoard: { name: "Other" },
    });

    expect(navigation.goToBoard).not.toHaveBeenCalled();
    expect(message.setParts).toHaveBeenCalledTimes(1);
  });

  test("treats an empty actions array as no actions and speaks instead", () => {
    const { activation, message } = setup();

    activation.activateButton({
      id: "btn",
      label: "hi",
      actions: [],
    });

    expect(message.setParts).toHaveBeenCalledTimes(1);
  });

  test("adds the button as a message part when there are no actions and no loadBoard", () => {
    const message = createMessageStub([]);
    const { activation } = setup({ message });

    activation.activateButton({
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

  test("plays the button's soundSrc rather than speaking when both are present", () => {
    const { activation } = setup();

    activation.activateButton({
      id: "btn",
      label: "bell",
      soundSrc: "bell.mp3",
    });

    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(speech.speak).not.toHaveBeenCalled();
  });

  test("speaks the lowercased vocalization when no soundSrc", () => {
    const { activation } = setup();

    activation.activateButton({
      id: "btn",
      label: "I",
      vocalization: "Hello",
    });

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak.mock.calls[0][0].text).toBe("hello");
  });

  test("falls back to the lowercased label when vocalization is absent", () => {
    const { activation } = setup();

    activation.activateButton({ id: "btn", label: "Goodbye" });

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak.mock.calls[0][0].text).toBe("goodbye");
  });

  test("stays silent when the button has neither sound nor any speakable text", () => {
    const { activation, message } = setup();

    activation.activateButton({ id: "btn" });

    expect(message.setParts).toHaveBeenCalledTimes(1);
    expect(speech.speak).not.toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
  });
});
