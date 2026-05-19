import { SpeechProvider } from "@shared/speech/speech-provider";
import { stubAudio, stubSpeech } from "@shared/testing/device-output";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { MessagePart } from "./use-message";
import { useMessagePlayback } from "./use-message-playback";

function SpeechWrapper({ children }: { children: ReactNode }) {
  return <SpeechProvider>{children}</SpeechProvider>;
}

describe("useMessagePlayback", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("speaks consecutive text parts as one merged utterance", async () => {
    const parts: MessagePart[] = [
      { id: "1", label: "I" },
      { id: "2", label: "want" },
    ];

    const { result } = await renderHook(() => useMessagePlayback(parts), {
      wrapper: SpeechWrapper,
    });

    await result.current.play();

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak.mock.calls[0][0].text).toBe("I want");
  });

  test("plays a sound part as audio rather than speaking it", async () => {
    const parts: MessagePart[] = [
      { id: "1", label: "bell", soundSrc: "bell.mp3" },
    ];

    const { result } = await renderHook(() => useMessagePlayback(parts), {
      wrapper: SpeechWrapper,
    });

    await result.current.play();

    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(speech.speak).not.toHaveBeenCalled();
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

    const { result } = await renderHook(() => useMessagePlayback(parts), {
      wrapper: SpeechWrapper,
    });

    await result.current.play();

    expect(callOrder).toEqual(["speak:before", "play:ding.mp3", "speak:after"]);
  });

  test("drops parts with no audible content", async () => {
    const parts: MessagePart[] = [{ id: "1" }];

    const { result } = await renderHook(() => useMessagePlayback(parts), {
      wrapper: SpeechWrapper,
    });

    await result.current.play();

    expect(speech.speak).not.toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
  });

  test("prefers vocalization over label when both are present", async () => {
    const parts: MessagePart[] = [{ id: "1", label: "I", vocalization: "eye" }];

    const { result } = await renderHook(() => useMessagePlayback(parts), {
      wrapper: SpeechWrapper,
    });

    await result.current.play();

    expect(speech.speak.mock.calls[0][0].text).toBe("eye");
  });

  test("reports isPlaying true during playback and false after it resolves", async () => {
    let resolveSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveSpeak = () => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      };
    });

    const parts: MessagePart[] = [{ id: "1", label: "hi" }];

    const { result, rerender } = await renderHook(
      () => useMessagePlayback(parts),
      { wrapper: SpeechWrapper },
    );

    const playPromise = result.current.play();
    await rerender();
    expect(result.current.isPlaying).toBe(true);

    resolveSpeak?.();
    await playPromise;
    await rerender();
    expect(result.current.isPlaying).toBe(false);
  });

  test("stop() cancels speech and clears isPlaying", async () => {
    let resolveSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveSpeak = () => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      };
    });

    const parts: MessagePart[] = [{ id: "1", label: "hi" }];

    const { result, rerender } = await renderHook(
      () => useMessagePlayback(parts),
      { wrapper: SpeechWrapper },
    );

    const playPromise = result.current.play();
    await rerender();

    result.current.stop();
    await rerender();

    expect(speech.cancel).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);

    resolveSpeak?.();
    await playPromise;
  });

  test("swallows playback errors and still resets isPlaying to false", async () => {
    speech.speak.mockImplementationOnce((utterance) => {
      queueMicrotask(() => {
        utterance.onerror?.({
          error: "synthesis-failed",
        } as unknown as SpeechSynthesisErrorEvent);
      });
    });
    vi.spyOn(console, "error").mockReturnValue(undefined);

    const parts: MessagePart[] = [{ id: "1", label: "hi" }];

    const { result, rerender } = await renderHook(
      () => useMessagePlayback(parts),
      { wrapper: SpeechWrapper },
    );

    await expect(result.current.play()).resolves.toBeUndefined();
    await rerender();

    expect(result.current.isPlaying).toBe(false);
  });
});
