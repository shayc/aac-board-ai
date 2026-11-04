import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { beforeEach, describe, expect, test } from "vitest";
import { render, renderHook } from "vitest-browser-react";
import { PlaybackProvider } from "./playback-provider";
import {
  useActiveTrackingKey,
  useIsPlaying,
  usePlayback,
} from "./use-playback";

function PlaybackControls() {
  const playback = usePlayback();

  const play = () => {
    void playback.play({
      owner: "message",
      steps: [
        {
          kind: "speech",
          text: "hello world",
          trackingKeyAt: (charIndex) => (charIndex < 6 ? "1" : "2"),
        },
      ],
    });
  };

  return (
    <>
      <button onClick={play}>Play</button>
      <button onClick={playback.stop}>Stop</button>
    </>
  );
}

function PlayingStatus() {
  return <p>{useIsPlaying() ? "Playing" : "Idle"}</p>;
}

function ActiveTrackingKey() {
  return <p>Active key: {useActiveTrackingKey() ?? "none"}</p>;
}

describe("PlaybackProvider", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  test("interrupts speech from another owner when new audio is requested", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    const { result } = await renderHook(() => usePlayback(), {
      wrapper: PlaybackProvider,
    });

    const speechResult = result.current.play({
      owner: "message",
      steps: [{ kind: "speech", text: "hello" }],
    });
    const audioResult = result.current.play({
      owner: "tile",
      steps: [{ kind: "audio", src: "bell.mp3" }],
    });

    await expect(speechResult).resolves.toBe("interrupted");
    await expect(audioResult).resolves.toBe("completed");
    expect(speech.cancel).toHaveBeenCalled();
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  test("interrupts and pauses audio when new speech is requested", async () => {
    audio.play.mockImplementationOnce(() => Promise.resolve());
    const { result } = await renderHook(() => usePlayback(), {
      wrapper: PlaybackProvider,
    });

    const audioResult = result.current.play({
      owner: "tile",
      steps: [{ kind: "audio", src: "bell.mp3" }],
    });
    const speechResult = result.current.play({
      owner: "message",
      steps: [{ kind: "speech", text: "hello" }],
    });

    await expect(audioResult).resolves.toBe("interrupted");
    await expect(speechResult).resolves.toBe("completed");
    expect(audio.pause).toHaveBeenCalled();
    expect(speech.speak).toHaveBeenCalledTimes(1);
  });

  test("rerenders each subscriber only for the playback state it reads", async () => {
    let utterance: SpeechSynthesisUtterance | undefined;
    speech.speak.mockImplementationOnce((spoken) => {
      utterance = spoken;
    });
    const commits = { controls: 0, playing: 0, tracking: 0 };
    const countCommit: ProfilerOnRenderCallback = (id) => {
      commits[id as keyof typeof commits] += 1;
    };
    const screen = await render(
      <PlaybackProvider>
        <Profiler id="controls" onRender={countCommit}>
          <PlaybackControls />
        </Profiler>
        <Profiler id="playing" onRender={countCommit}>
          <PlayingStatus />
        </Profiler>
        <Profiler id="tracking" onRender={countCommit}>
          <ActiveTrackingKey />
        </Profiler>
      </PlaybackProvider>,
    );

    await screen.getByRole("button", { name: "Play" }).click();
    await expect.element(screen.getByText("Playing")).toBeInTheDocument();
    await expect.element(screen.getByText("Active key: 1")).toBeInTheDocument();
    const commitsWhilePlaying = { ...commits };

    utterance?.dispatchEvent(
      new SpeechSynthesisEvent("boundary", { utterance, charIndex: 6 }),
    );
    await expect.element(screen.getByText("Active key: 2")).toBeInTheDocument();

    expect(commitsWhilePlaying.controls).toBe(1);
    expect(commits).toEqual({
      ...commitsWhilePlaying,
      tracking: commitsWhilePlaying.tracking + 1,
    });

    await screen.getByRole("button", { name: "Stop" }).click();
    await expect.element(screen.getByText("Idle")).toBeInTheDocument();
  });
});
