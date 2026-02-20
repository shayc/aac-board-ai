import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { SpeechContext } from "@shared/contexts/SpeechProvider/SpeechContext";
import type { SpeechContextValue } from "@shared/contexts/SpeechProvider/SpeechContext";
import type { BoardAction, BoardButton } from "@features/board/types";
import type { UseMessageReturn } from "./useMessage";
import type { UseMessagePlaybackReturn } from "./useMessagePlayback";
import type { UseBoardNavigationReturn } from "./useBoardNavigation";
import { useButtonActivation } from "./useButtonActivation";

function createSpeechStub(): SpeechContextValue {
  return {
    langs: [],
    voicesByLang: {},
    voicesByLocale: {},
    voices: [],
    voiceURI: "",
    setVoiceURI: vi.fn(),
    pitch: 1,
    setPitch: vi.fn(),
    rate: 1,
    setRate: vi.fn(),
    volume: 1,
    setVolume: vi.fn(),
    speak: vi.fn<(text: string) => Promise<void>>().mockResolvedValue(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    isSpeechSupported: true,
    isSpeaking: false,
    isPaused: false,
  };
}

function createMessageStub(
  parts: UseMessageReturn["parts"] = [],
): UseMessageReturn {
  return {
    parts,
    text: parts.map((p) => p.label).join(" "),
    addPart: vi.fn(),
    addSpace: vi.fn(),
    setParts: vi.fn(),
    setFromText: vi.fn(),
    removeLastPart: vi.fn(),
    updateLastPart: vi.fn(),
    clear: vi.fn(),
  };
}

function createPlaybackStub(): UseMessagePlaybackReturn {
  return {
    isPlaying: false,
    play: vi.fn<() => Promise<void>>().mockResolvedValue(),
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

let speechStub: SpeechContextValue;
let messageStub: UseMessageReturn;
let playbackStub: UseMessagePlaybackReturn;
let navigationStub: UseBoardNavigationReturn;
let audioPlaySpy: ReturnType<typeof vi.spyOn>;

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SpeechContext value={speechStub}>{children}</SpeechContext>;
  };
}

describe("useButtonActivation", () => {
  beforeEach(() => {
    speechStub = createSpeechStub();
    messageStub = createMessageStub();
    playbackStub = createPlaybackStub();
    navigationStub = createNavigationStub();

    audioPlaySpy = vi
      .spyOn(HTMLAudioElement.prototype, "play")
      .mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderActivation(
    overrides: {
      message?: UseMessageReturn;
      playback?: UseMessagePlaybackReturn;
      navigation?: UseBoardNavigationReturn;
    } = {},
  ) {
    return renderHook(
      () =>
        useButtonActivation({
          message: overrides.message ?? messageStub,
          playback: overrides.playback ?? playbackStub,
          navigation: overrides.navigation ?? navigationStub,
        }),
      { wrapper: createWrapper() },
    );
  }

  describe("loadBoard button", () => {
    test("navigates to linked board and does not add message part", async () => {
      const button: BoardButton = {
        id: "btn-1",
        label: "Go",
        loadBoard: { id: "board-2" },
      };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(navigationStub.goToBoard).toHaveBeenCalledWith("board-2");
      expect(messageStub.addPart).not.toHaveBeenCalled();
    });

    test("loadBoard takes priority over actions", async () => {
      const button: BoardButton = {
        id: "btn-1",
        label: "Go",
        loadBoard: { id: "board-2" },
        actions: [":speak"],
      };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(navigationStub.goToBoard).toHaveBeenCalledWith("board-2");
      expect(playbackStub.play).not.toHaveBeenCalled();
    });

    test("falls through to default when loadBoard.id is falsy", async () => {
      const button: BoardButton = {
        id: "btn-1",
        label: "Go",
        loadBoard: {},
      };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(navigationStub.goToBoard).not.toHaveBeenCalled();
      expect(messageStub.addPart).toHaveBeenCalled();
      expect(speechStub.speak).toHaveBeenCalledWith("go");
    });
  });

  describe("actions button", () => {
    test(":space adds a space", async () => {
      const button: BoardButton = { id: "btn-1", actions: [":space"] };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(messageStub.addSpace).toHaveBeenCalled();
    });

    test(":backspace removes last part", async () => {
      const button: BoardButton = { id: "btn-1", actions: [":backspace"] };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(messageStub.removeLastPart).toHaveBeenCalled();
    });

    test(":speak triggers playback", async () => {
      const button: BoardButton = { id: "btn-1", actions: [":speak"] };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(playbackStub.play).toHaveBeenCalled();
    });

    test(":clear clears the message", async () => {
      const button: BoardButton = { id: "btn-1", actions: [":clear"] };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(messageStub.clear).toHaveBeenCalled();
    });

    test(":home navigates home", async () => {
      const button: BoardButton = { id: "btn-1", actions: [":home"] };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(navigationStub.goHome).toHaveBeenCalled();
    });

    test("+letter appends to last part label", async () => {
      const message = createMessageStub([{ id: "h", label: "h" }]);
      const button: BoardButton = { id: "btn-1", actions: ["+i"] };

      const { result, act } = await renderActivation({ message });
      await act(() => result.current.activateButton(button));

      expect(message.updateLastPart).toHaveBeenCalledWith({
        id: "i",
        label: "hi",
      });
    });

    test("+letter with empty message creates part from letter only", async () => {
      const message = createMessageStub([]);
      const button: BoardButton = { id: "btn-1", actions: ["+a"] };

      const { result, act } = await renderActivation({ message });
      await act(() => result.current.activateButton(button));

      expect(message.updateLastPart).toHaveBeenCalledWith({
        id: "a",
        label: "a",
      });
    });

    test("unrecognized action silently no-ops", async () => {
      const button: BoardButton = {
        id: "btn-1",
        actions: [":unknown" as BoardAction],
      };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(messageStub.addPart).not.toHaveBeenCalled();
      expect(speechStub.speak).not.toHaveBeenCalled();
    });

    test("multiple actions execute in order", async () => {
      const callOrder: string[] = [];

      const message = createMessageStub();
      vi.mocked(message.addSpace).mockImplementation(() => {
        callOrder.push("space");
      });
      vi.mocked(message.clear).mockImplementation(() => {
        callOrder.push("clear");
      });

      const playback = createPlaybackStub();
      vi.mocked(playback.play).mockImplementation(() => {
        callOrder.push("speak");
        return Promise.resolve();
      });

      const button: BoardButton = {
        id: "btn-1",
        actions: [":space", ":speak", ":clear"],
      };

      const { result, act } = await renderActivation({ message, playback });
      await act(() => result.current.activateButton(button));

      expect(callOrder).toEqual(["space", "speak", "clear"]);
    });
  });

  describe("default button", () => {
    test("adds message part and speaks label lowercased", async () => {
      const button: BoardButton = {
        id: "btn-1",
        label: "Hello",
        imageSrc: "img.png",
      };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(messageStub.addPart).toHaveBeenCalledWith({
        id: "btn-1",
        label: "Hello",
        vocalization: undefined,
        imageSrc: "img.png",
        soundSrc: undefined,
      });

      expect(speechStub.speak).toHaveBeenCalledWith("hello");
    });

    test("prefers vocalization over label for speech", async () => {
      const button: BoardButton = {
        id: "btn-1",
        label: "Hi",
        vocalization: "Greetings",
      };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(speechStub.speak).toHaveBeenCalledWith("greetings");
    });

    test("plays sound instead of speaking when soundSrc is present", async () => {
      const button: BoardButton = {
        id: "btn-1",
        label: "Bark",
        soundSrc: "data:audio/wav;base64,UklGR",
      };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(audioPlaySpy).toHaveBeenCalled();
      expect(speechStub.speak).not.toHaveBeenCalled();
    });

    test("does not speak when label and vocalization are both missing", async () => {
      const button: BoardButton = { id: "btn-1" };

      const { result, act } = await renderActivation();
      await act(() => result.current.activateButton(button));

      expect(messageStub.addPart).toHaveBeenCalled();
      expect(speechStub.speak).not.toHaveBeenCalled();
    });
  });
});
