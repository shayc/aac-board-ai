import { stubAudio } from "@shared/testing/stub-audio";
import { preventSpeechEnd, stubSpeech } from "@shared/testing/stub-speech";
import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from "react";
import { beforeEach, describe, expect, test } from "vitest";
import { render, renderHook } from "vitest-browser-react";
import { PlaybackProvider } from "./playback-provider";
import type { SpeechSettings } from "./playback-types";
import { useActiveCue, useIsPlaying, usePlayback } from "./use-playback";

const speechSettings: SpeechSettings = {
  lang: "en",
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
};

function TestPlaybackProvider({ children }: { children: ReactNode }) {
  return (
    <PlaybackProvider getSpeechSettings={() => speechSettings}>
      {children}
    </PlaybackProvider>
  );
}

function PlaybackControls() {
  const playback = usePlayback();

  const play = () => {
    void playback.play({
      owner: "message",
      steps: [
        {
          kind: "speech",
          text: "hello world",
          cueAt: (charIndex) => (charIndex < 6 ? "1" : "2"),
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

function ActiveCue() {
  return <p>Active cue: {useActiveCue() ?? "none"}</p>;
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
      wrapper: TestPlaybackProvider,
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
      wrapper: TestPlaybackProvider,
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

  test("keeps a playback that interrupts another active until it is stopped", async () => {
    preventSpeechEnd(speech.speak);
    const { result, rerender } = await renderHook(
      () => ({ playback: usePlayback(), isTilePlaying: useIsPlaying("tile") }),
      { wrapper: TestPlaybackProvider },
    );
    const { playback } = result.current;

    const interrupted = playback.play({
      owner: "message",
      steps: [{ kind: "speech", text: "hello" }],
    });
    const interrupting = playback.play({
      owner: "tile",
      steps: [{ kind: "speech", text: "world" }],
    });

    await expect(interrupted).resolves.toBe("interrupted");
    await rerender();
    expect(result.current.isTilePlaying).toBe(true);

    playback.stop();

    await expect(interrupting).resolves.toBe("interrupted");
    await rerender();
    expect(result.current.isTilePlaying).toBe(false);
  });

  test("reports a failed step after playing the remaining steps", async () => {
    audio.play.mockImplementationOnce(() =>
      Promise.reject(new DOMException("Blocked", "NotAllowedError")),
    );
    const { result } = await renderHook(() => usePlayback(), {
      wrapper: TestPlaybackProvider,
    });

    const outcome = result.current.play({
      owner: "message",
      steps: [
        { kind: "audio", src: "recording.mp3" },
        { kind: "speech", text: "hello" },
      ],
    });

    await expect(outcome).resolves.toBe("failed");
    expect(speech.spokenTexts()).toEqual(["hello"]);
  });

  test("speaks each request with the settings current at that moment", async () => {
    let currentSettings = speechSettings;
    const { result } = await renderHook(() => usePlayback(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <PlaybackProvider getSpeechSettings={() => currentSettings}>
          {children}
        </PlaybackProvider>
      ),
    });
    const request = {
      owner: "message",
      steps: [{ kind: "speech", text: "hello" }],
    } as const;

    await result.current.play(request);
    currentSettings = { ...speechSettings, lang: "he", rate: 1.5 };
    await result.current.play(request);

    const [first, second] = speech.speak.mock.calls.map(([spoken]) => spoken);
    expect(first).toMatchObject({ lang: "en", rate: 1 });
    expect(second).toMatchObject({ lang: "he", rate: 1.5 });
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
      <TestPlaybackProvider>
        <Profiler id="controls" onRender={countCommit}>
          <PlaybackControls />
        </Profiler>
        <Profiler id="playing" onRender={countCommit}>
          <PlayingStatus />
        </Profiler>
        <Profiler id="tracking" onRender={countCommit}>
          <ActiveCue />
        </Profiler>
      </TestPlaybackProvider>,
    );

    await screen.getByRole("button", { name: "Play" }).click();
    await expect.element(screen.getByText("Playing")).toBeInTheDocument();
    await expect.element(screen.getByText("Active cue: 1")).toBeInTheDocument();
    const commitsWhilePlaying = { ...commits };

    utterance?.dispatchEvent(
      new SpeechSynthesisEvent("boundary", { utterance, charIndex: 6 }),
    );
    await expect.element(screen.getByText("Active cue: 2")).toBeInTheDocument();

    expect(commitsWhilePlaying.controls).toBe(1);
    expect(commits).toEqual({
      ...commitsWhilePlaying,
      tracking: commitsWhilePlaying.tracking + 1,
    });

    await screen.getByRole("button", { name: "Stop" }).click();
    await expect.element(screen.getByText("Idle")).toBeInTheDocument();
  });
});
