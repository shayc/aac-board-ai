import { stubAudio, stubSpeech } from "@shared/testing/device-output";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { MessagePart, UseMessageReturn } from "../message/use-message";
import type { UseMessagePlaybackReturn } from "../message/use-message-playback";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { BoardAction, BoardButton } from "../types";
import { useButtonActivation } from "./use-button-activation";

function createMessageStub(parts: MessagePart[] = []): UseMessageReturn {
  return {
    parts,
    text: parts.map((p) => p.label ?? "").join(" "),
    addPart: vi.fn(),
    addSpace: vi.fn(),
    setFromText: vi.fn(),
    removeLastPart: vi.fn(),
    updateLastPart: vi.fn(),
    clear: vi.fn(),
  };
}

function createPlaybackStub(): UseMessagePlaybackReturn {
  return {
    isPlaying: false,
    play: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
  };
}

function createNavigationStub(): UseBoardNavigationReturn {
  return {
    canGoBack: false,
    canGoHome: true,
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

async function setup(opts: SetupOptions = {}) {
  const message = opts.message ?? createMessageStub();
  const playback = opts.playback ?? createPlaybackStub();
  const navigation = opts.navigation ?? createNavigationStub();

  const { result } = await renderHook(() =>
    useButtonActivation({ message, playback, navigation }),
  );

  return { result, message, playback, navigation };
}

describe("useButtonActivation", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  test("navigates to the linked board and skips message and audio when loadBoard.id is set", async () => {
    const { result, message, playback, navigation } = await setup();

    const button: BoardButton = {
      id: "btn",
      label: "Folder",
      loadBoard: { id: "child-board" },
    };

    await result.current.activateButton(button);

    expect(navigation.goToBoard).toHaveBeenCalledWith("child-board");
    expect(message.addPart).not.toHaveBeenCalled();
    expect(playback.play).not.toHaveBeenCalled();
    expect(speech.speak).not.toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
  });

  test("navigates when loadBoard.id is set even if actions are also present", async () => {
    const { result, message, playback, navigation } = await setup();

    await result.current.activateButton({
      id: "btn",
      label: "Folder",
      loadBoard: { id: "child-board" },
      actions: [{ kind: "space" }],
    });

    expect(navigation.goToBoard).toHaveBeenCalledWith("child-board");
    expect(message.addSpace).not.toHaveBeenCalled();
    expect(playback.play).not.toHaveBeenCalled();
  });

  test("runs each action in order for an actions array", async () => {
    const callOrder: string[] = [];
    const message = createMessageStub();
    message.addSpace = vi.fn(() => {
      callOrder.push("addSpace");
    });
    message.clear = vi.fn(() => {
      callOrder.push("clear");
    });
    const playback = createPlaybackStub();
    playback.play = vi.fn(() => {
      callOrder.push("play");
      return Promise.resolve();
    });

    const { result } = await setup({ message, playback });

    await result.current.activateButton({
      id: "btn",
      actions: [{ kind: "space" }, { kind: "speak" }, { kind: "clear" }],
    });

    expect(callOrder).toEqual(["addSpace", "play", "clear"]);
  });

  test.each([
    ["space", "addSpace"],
    ["backspace", "removeLastPart"],
    ["clear", "clear"],
  ] as const)("maps %s to message.%s", async (kind, methodName) => {
    const { result, message } = await setup();

    await result.current.activateButton({ id: "btn", actions: [{ kind }] });

    expect(message[methodName]).toHaveBeenCalledTimes(1);
  });

  test("maps speak to playback.play", async () => {
    const { result, playback } = await setup();

    await result.current.activateButton({
      id: "btn",
      actions: [{ kind: "speak" }],
    });

    expect(playback.play).toHaveBeenCalledTimes(1);
  });

  test("maps home to navigation.goHome", async () => {
    const { result, navigation } = await setup();

    await result.current.activateButton({
      id: "btn",
      actions: [{ kind: "home" }],
    });

    expect(navigation.goHome).toHaveBeenCalledTimes(1);
  });

  test("appends a spell action's text to the last message part's label", async () => {
    const message = createMessageStub([{ id: "ca", label: "ca" }]);
    const { result } = await setup({ message });

    await result.current.activateButton({
      id: "btn",
      actions: [{ kind: "spell", text: "t" }],
    });

    expect(message.updateLastPart).toHaveBeenCalledWith({
      id: "t",
      label: "cat",
    });
  });

  test("treats a loadBoard without an id as not navigable and speaks instead", async () => {
    const { result, message, navigation } = await setup();

    await result.current.activateButton({
      id: "btn",
      label: "hi",
      loadBoard: { name: "Other" },
    });

    expect(navigation.goToBoard).not.toHaveBeenCalled();
    expect(message.addPart).toHaveBeenCalledTimes(1);
  });

  test("treats an empty actions array as no actions and speaks instead", async () => {
    const { result, message } = await setup();

    await result.current.activateButton({
      id: "btn",
      label: "hi",
      actions: [] as BoardAction[],
    });

    expect(message.addPart).toHaveBeenCalledTimes(1);
  });

  test("adds the button as a message part when there are no actions and no loadBoard", async () => {
    const { result, message } = await setup();

    await result.current.activateButton({
      id: "btn",
      label: "hi",
      vocalization: "hello",
      imageSrc: "img.png",
    });

    expect(message.addPart).toHaveBeenCalledWith({
      id: "btn",
      label: "hi",
      vocalization: "hello",
      imageSrc: "img.png",
      soundSrc: undefined,
    });
  });

  test("plays the button's soundSrc rather than speaking when both are present", async () => {
    const { result } = await setup();

    await result.current.activateButton({
      id: "btn",
      label: "bell",
      soundSrc: "bell.mp3",
    });

    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(speech.speak).not.toHaveBeenCalled();
  });

  test("speaks the lowercased vocalization when no soundSrc", async () => {
    const { result } = await setup();

    await result.current.activateButton({
      id: "btn",
      label: "I",
      vocalization: "Hello",
    });

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak.mock.calls[0][0].text).toBe("hello");
  });

  test("falls back to the lowercased label when vocalization is absent", async () => {
    const { result } = await setup();

    await result.current.activateButton({ id: "btn", label: "Goodbye" });

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak.mock.calls[0][0].text).toBe("goodbye");
  });

  test("stays silent when the button has neither sound nor any speakable text", async () => {
    const { result, message } = await setup();

    await result.current.activateButton({ id: "btn" });

    expect(message.addPart).toHaveBeenCalledTimes(1);
    expect(speech.speak).not.toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
  });
});
