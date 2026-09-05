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

  test("reports partial output and stops at the first failed step without replaying", async () => {
    audio.play.mockRejectedValueOnce(new Error("Recording unavailable"));
    const { result } = await renderHook(usePlayback, {
      wrapper: PlaybackProvider,
    });
    const outcome = await result.current.play({
      origin: "message",
      steps: [
        { kind: "speech", text: "before" },
        { kind: "audio", src: "missing.mp3" },
        { kind: "speech", text: "after" },
      ],
    });

    expect(outcome).toMatchObject({
      status: "failed",
      completedSteps: 1,
      failedStepIndex: 1,
    });
    expect(
      speech.speak.mock.calls.map(([utterance]) => utterance.text),
    ).toEqual(["before"]);
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(result.current.getSnapshot()).toEqual({ status: "idle" });
  });

  test("empty requests are explicit no-ops and leave current output running", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    const { result } = await renderHook(usePlayback, {
      wrapper: PlaybackProvider,
    });
    const active = result.current.play({
      origin: "message",
      steps: [{ kind: "speech", text: "hello" }],
    });
    await expect(
      result.current.play({ origin: "silent-tile", steps: [] }),
    ).resolves.toEqual({ status: "empty", completedSteps: 0 });
    expect(result.current.getSnapshot()).toMatchObject({
      status: "playing",
      origin: "message",
    });
    result.current.stop();
    await expect(active).resolves.toEqual({
      status: "interrupted",
      completedSteps: 0,
    });
  });

  test("counts a finished step even when a new request interrupts before its continuation", async () => {
    speech.speak.mockImplementationOnce((utterance) => {
      utterance.onend?.({} as SpeechSynthesisEvent);
    });
    const { result } = await renderHook(usePlayback, {
      wrapper: PlaybackProvider,
    });
    const first = result.current.play({
      origin: "first",
      steps: [
        { kind: "speech", text: "finished" },
        { kind: "speech", text: "not started" },
      ],
    });
    const second = result.current.play({
      origin: "second",
      steps: [{ kind: "audio", src: "bell.mp3" }],
    });

    await expect(first).resolves.toEqual({
      status: "interrupted",
      completedSteps: 1,
    });
    await expect(second).resolves.toEqual({
      status: "completed",
      completedSteps: 1,
    });
    expect(speech.speak).toHaveBeenCalledTimes(1);
  });

  test("recovers after synchronous device output failure", async () => {
    speech.speak.mockImplementationOnce(() => {
      throw new Error("Device failure");
    });
    const { result } = await renderHook(usePlayback, {
      wrapper: PlaybackProvider,
    });
    await expect(
      result.current.play({
        origin: "message",
        steps: [{ kind: "speech", text: "hello" }],
      }),
    ).resolves.toMatchObject({
      status: "failed",
      completedSteps: 0,
      failedStepIndex: 0,
    });
    await expect(
      result.current.play({
        origin: "message",
        steps: [{ kind: "speech", text: "retry" }],
      }),
    ).resolves.toEqual({ status: "completed", completedSteps: 1 });
  });

  test("a new audio request interrupts speech from another origin", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    const { result } = await renderHook(() => usePlayback(), {
      wrapper: PlaybackProvider,
    });

    const speechResult = result.current.play({
      origin: "message",
      steps: [{ kind: "speech", text: "hello" }],
    });
    const audioResult = result.current.play({
      origin: "tile",
      steps: [{ kind: "audio", src: "bell.mp3" }],
    });

    await expect(speechResult).resolves.toMatchObject({
      status: "interrupted",
    });
    await expect(audioResult).resolves.toMatchObject({ status: "completed" });
    expect(speech.cancel).toHaveBeenCalled();
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  test("a new speech request interrupts and pauses audio", async () => {
    audio.play.mockImplementationOnce(() => Promise.resolve());
    const { result } = await renderHook(() => usePlayback(), {
      wrapper: PlaybackProvider,
    });

    const audioResult = result.current.play({
      origin: "tile",
      steps: [{ kind: "audio", src: "bell.mp3" }],
    });
    const speechResult = result.current.play({
      origin: "message",
      steps: [{ kind: "speech", text: "hello" }],
    });

    await expect(audioResult).resolves.toMatchObject({ status: "interrupted" });
    await expect(speechResult).resolves.toMatchObject({ status: "completed" });
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
      origin: "message",
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
      origin: "message",
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
      origin: "message",
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
