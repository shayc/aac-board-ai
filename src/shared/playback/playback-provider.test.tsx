import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { PlaybackProvider } from "./playback-provider";
import {
  useActivePlaybackTrackingKey,
  useIsPlaybackActive,
  usePlayback,
} from "./use-playback";

describe("PlaybackProvider", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  test("a new audio request interrupts speech from another source", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    const { result } = await renderHook(() => usePlayback(), {
      wrapper: PlaybackProvider,
    });

    const speechResult = result.current.play({
      source: "message",
      steps: [{ kind: "speech", text: "hello" }],
    });
    const audioResult = result.current.play({
      source: "tile",
      steps: [{ kind: "audio", src: "bell.mp3" }],
    });

    await expect(speechResult).resolves.toBe("interrupted");
    await expect(audioResult).resolves.toBe("completed");
    expect(speech.cancel).toHaveBeenCalled();
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  test("a new speech request interrupts and pauses audio", async () => {
    audio.play.mockImplementationOnce(() => Promise.resolve());
    const { result } = await renderHook(() => usePlayback(), {
      wrapper: PlaybackProvider,
    });

    const audioResult = result.current.play({
      source: "tile",
      steps: [{ kind: "audio", src: "bell.mp3" }],
    });
    const speechResult = result.current.play({
      source: "message",
      steps: [{ kind: "speech", text: "hello" }],
    });

    await expect(audioResult).resolves.toBe("interrupted");
    await expect(speechResult).resolves.toBe("completed");
    expect(audio.pause).toHaveBeenCalled();
    expect(speech.speak).toHaveBeenCalledTimes(1);
  });

  test("playback controls do not rerender when playback state changes", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    let renderCount = 0;
    const { result } = await renderHook(
      () => {
        renderCount += 1;

        return usePlayback();
      },
      { wrapper: PlaybackProvider },
    );
    const initialRenderCount = renderCount;

    const playbackResult = result.current.play({
      source: "message",
      steps: [{ kind: "speech", text: "hello" }],
    });
    await Promise.resolve();

    expect(renderCount).toBe(initialRenderCount);

    result.current.stop();
    await playbackResult;
  });

  test("playing-state subscribers do not rerender for word boundaries", async () => {
    let utterance: SpeechSynthesisUtterance | undefined;
    speech.speak.mockImplementationOnce((spoken) => {
      utterance = spoken;
    });
    let renderCount = 0;
    const { result } = await renderHook(
      () => {
        renderCount += 1;

        return {
          controls: usePlayback(),
          isPlaying: useIsPlaybackActive(),
        };
      },
      { wrapper: PlaybackProvider },
    );

    const playbackResult = result.current.controls.play({
      source: "message",
      steps: [
        {
          kind: "speech",
          text: "hello world",
          trackingKeyAt: (charIndex) => (charIndex < 6 ? "1" : "2"),
        },
      ],
    });
    await vi.waitFor(() => expect(result.current.isPlaying).toBe(true));
    const playingRenderCount = renderCount;

    utterance?.onboundary?.({ charIndex: 6 } as SpeechSynthesisEvent);
    await Promise.resolve();

    expect(renderCount).toBe(playingRenderCount);

    result.current.controls.stop();
    await playbackResult;
  });

  test("tracking subscribers receive the active key", async () => {
    let utterance: SpeechSynthesisUtterance | undefined;
    speech.speak.mockImplementationOnce((spoken) => {
      utterance = spoken;
    });
    const { result } = await renderHook(
      () => ({
        controls: usePlayback(),
        activeTrackingKey: useActivePlaybackTrackingKey(),
      }),
      { wrapper: PlaybackProvider },
    );

    const playbackResult = result.current.controls.play({
      source: "message",
      steps: [
        {
          kind: "speech",
          text: "hello world",
          trackingKeyAt: (charIndex) => (charIndex < 6 ? "1" : "2"),
        },
      ],
    });
    await vi.waitFor(() => expect(result.current.activeTrackingKey).toBe("1"));

    utterance?.onboundary?.({ charIndex: 6 } as SpeechSynthesisEvent);
    await vi.waitFor(() => expect(result.current.activeTrackingKey).toBe("2"));

    result.current.controls.stop();
    await playbackResult;
  });
});
