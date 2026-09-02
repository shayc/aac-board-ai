import { PlaybackProvider } from "@shared/playback/playback-provider";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { MessagePart } from "../message/message-types";
import { useActiveMessagePartId, useBoardPlayback } from "./use-board-playback";

function renderPlayback() {
  return renderHook(
    () => ({
      ...useBoardPlayback(),
      activePartId: useActiveMessagePartId(),
    }),
    { wrapper: PlaybackProvider },
  );
}

describe("useBoardPlayback", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  test("interleaves speech and audio in order when a sound breaks a text run", async () => {
    const parts: MessagePart[] = [
      { id: "1", label: "before" },
      { id: "2", label: "ding", soundSrc: "ding.mp3" },
      { id: "3", label: "after" },
    ];

    const callOrder: string[] = [];
    speech.speak.mockImplementation((utterance) => {
      callOrder.push(`speak:${utterance.text}`);
      queueMicrotask(() => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      });
    });
    audio.play.mockImplementation(function (this: HTMLAudioElement) {
      callOrder.push(`play:${this.src.split("/").pop()}`);
      queueMicrotask(() => {
        this.dispatchEvent(new Event("play"));
        this.dispatchEvent(new Event("ended"));
      });

      return Promise.resolve();
    });

    const { result } = await renderPlayback();

    await result.current.playMessage(parts);

    expect(callOrder).toEqual(["speak:before", "play:ding.mp3", "speak:after"]);
  });

  test("reports isMessagePlaying true during playback and false after it resolves", async () => {
    let resolveSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveSpeak = () => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      };
    });

    const parts: MessagePart[] = [{ id: "1", label: "hi" }];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage(parts);
    await rerender();
    expect(result.current.isMessagePlaying).toBe(true);

    resolveSpeak?.();
    await playPromise;
    await rerender();
    expect(result.current.isMessagePlaying).toBe(false);
  });

  test("does not present tile speech as message playback", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playPart({ id: "1", label: "hi" });
    await rerender();

    expect(result.current.isMessagePlaying).toBe(false);
    expect(result.current.activePartId).toBeNull();

    result.current.stop();
    await playPromise;
  });

  test("stop() cancels speech and clears isMessagePlaying", async () => {
    let resolveSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveSpeak = () => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      };
    });

    const parts: MessagePart[] = [{ id: "1", label: "hi" }];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage(parts);
    await rerender();

    result.current.stop();
    await rerender();

    expect(speech.cancel).toHaveBeenCalled();
    expect(result.current.isMessagePlaying).toBe(false);

    resolveSpeak?.();
    await playPromise;
  });

  test("resets isMessagePlaying to false after a speech error", async () => {
    speech.speak.mockImplementationOnce((utterance) => {
      queueMicrotask(() => {
        utterance.onerror?.({
          error: "synthesis-failed",
        } as unknown as SpeechSynthesisErrorEvent);
      });
    });

    const parts: MessagePart[] = [{ id: "1", label: "hi" }];

    const { result, rerender } = await renderPlayback();

    await expect(result.current.playMessage(parts)).resolves.toBe("completed");
    await rerender();

    expect(result.current.isMessagePlaying).toBe(false);
  });

  test("has no active part before playback starts", async () => {
    const { result } = await renderPlayback();

    expect(result.current.activePartId).toBeNull();
  });

  test("highlights the part at the current speech boundary, then clears it", async () => {
    let fireBoundary: ((charIndex: number) => void) | undefined;
    let endSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      fireBoundary = (charIndex) => {
        utterance.onboundary?.({ charIndex } as SpeechSynthesisEvent);
      };

      endSpeak = () => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      };
    });

    const parts: MessagePart[] = [
      { id: "1", label: "I" },
      { id: "2", label: "want" },
    ];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage(parts);
    await rerender();

    fireBoundary?.(2); // "want" begins at offset 2 in "i want"
    await rerender();
    expect(result.current.activePartId).toBe("2");

    endSpeak?.();
    await playPromise;
    await rerender();
    expect(result.current.activePartId).toBeNull();
  });

  test("clears the active part on stop", async () => {
    let resolveSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      utterance.onboundary?.({ charIndex: 0 } as SpeechSynthesisEvent);
      resolveSpeak = () => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      };
    });

    const parts: MessagePart[] = [{ id: "1", label: "hi" }];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage(parts);
    await rerender();
    expect(result.current.activePartId).toBe("1");

    result.current.stop();
    await rerender();
    expect(result.current.activePartId).toBeNull();

    resolveSpeak?.();
    await playPromise;
  });

  test("does not advance to later segments after stop", async () => {
    let resolveFirstSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveFirstSpeak = () => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      };
    });

    const parts: MessagePart[] = [
      { id: "1", label: "before" },
      { id: "2", label: "ding", soundSrc: "ding.mp3" },
      { id: "3", label: "after" },
    ];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage(parts);
    await rerender();

    result.current.stop();
    resolveFirstSpeak?.();
    await playPromise;
    await rerender();

    expect(speech.speak).toHaveBeenCalledTimes(1); // only "before", not "after"
    expect(audio.play).not.toHaveBeenCalled(); // the sound segment is skipped
    expect(result.current.activePartId).toBeNull();
  });

  test("ignores a boundary event that arrives after stop", async () => {
    let fireBoundary: ((charIndex: number) => void) | undefined;
    let resolveSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      fireBoundary = (charIndex) => {
        utterance.onboundary?.({ charIndex } as SpeechSynthesisEvent);
      };

      resolveSpeak = () => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      };
    });

    const parts: MessagePart[] = [
      { id: "1", label: "I" },
      { id: "2", label: "want" },
    ];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage(parts);
    await rerender();

    result.current.stop();
    fireBoundary?.(2);
    await rerender();
    expect(result.current.activePartId).toBeNull();

    resolveSpeak?.();
    await playPromise;
  });

  test("a second playMessage() call aborts the first and speaks only its own parts", async () => {
    let resolveFirstSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveFirstSpeak = () => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      };
    });
    speech.speak.mockImplementationOnce((utterance) => {
      queueMicrotask(() => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      });
    });

    const { result } = await renderPlayback();

    const firstPlay = result.current.playMessage([{ id: "1", label: "first" }]);
    const secondPlay = result.current.playMessage([
      { id: "2", label: "second" },
    ]);

    resolveFirstSpeak?.();
    await firstPlay;
    await secondPlay;

    expect(speech.speak).toHaveBeenCalledTimes(2);
    expect(speech.speak.mock.calls[1][0].text).toBe("second");
  });
});
