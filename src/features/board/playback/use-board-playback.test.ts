import { AppProviders } from "@shared/providers/app-providers";
import { failAudio, stubAudio } from "@shared/testing/stub-audio";
import {
  endUtterance,
  failSpeech,
  preventSpeechEnd,
  reachUtteranceBoundary,
  stubSpeech,
} from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { page } from "vitest/browser";
import type { MessagePart } from "../message/message";
import {
  useBoardPlayback,
  usePlayingMessagePartId,
} from "./use-board-playback";

function renderPlayback() {
  return renderHook(
    () => ({
      ...useBoardPlayback(),
      playingPartId: usePlayingMessagePartId(),
    }),
    { wrapper: AppProviders },
  );
}

describe("useBoardPlayback", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  test("tracks whether the message plays and which part through speech boundaries and completion", async () => {
    let fireBoundary: ((charIndex: number) => void) | undefined;
    let endSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      fireBoundary = (charIndex) =>
        reachUtteranceBoundary(utterance, charIndex);

      endSpeak = () => endUtterance(utterance);
    });

    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "I", language: "en" },
      { kind: "tile", id: "2", label: "want", language: "en" },
    ];

    const { result, rerender } = await renderPlayback();

    expect(result.current.isMessagePlaying).toBe(false);
    expect(result.current.playingPartId).toBeNull();

    const playPromise = result.current.playParts(parts);
    await rerender();
    expect(result.current.isMessagePlaying).toBe(true);
    expect(result.current.playingPartId).toBeNull();

    fireBoundary?.(2);
    await rerender();
    expect(result.current.isMessagePlaying).toBe(true);
    expect(result.current.playingPartId).toBe("2");

    endSpeak?.();
    await playPromise;
    await rerender();
    expect(result.current.isMessagePlaying).toBe(false);
    expect(result.current.playingPartId).toBeNull();
  });

  test("interleaves speech and audio in order when a sound breaks a text run", async () => {
    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "before", language: "en" },
      {
        kind: "tile",
        id: "2",
        label: "ding",
        language: "en",
        soundSrc: "ding.mp3",
      },
      { kind: "tile", id: "3", label: "after", language: "en" },
    ];

    const callOrder: string[] = [];
    speech.speak.mockImplementation((utterance) => {
      callOrder.push(`speak:${utterance.text}`);
      queueMicrotask(() => endUtterance(utterance));
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

    await result.current.playParts(parts);

    expect(callOrder).toEqual(["speak:before", "play:ding.mp3", "speak:after"]);
  });

  test("does not present tile speech as message playback", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playTile({
      kind: "tile",
      id: "1",
      label: "hi",
      language: "en",
    });
    await rerender();

    expect(result.current.isMessagePlaying).toBe(false);
    expect(result.current.playingPartId).toBeNull();

    result.current.stop();
    await playPromise;
  });

  test("cancels speech and clears playing and active-part state on stop", async () => {
    let resolveSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      reachUtteranceBoundary(utterance, 0);
      resolveSpeak = () => endUtterance(utterance);
    });

    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "hi", language: "en" },
    ];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playParts(parts);
    await rerender();
    expect(result.current.isMessagePlaying).toBe(true);
    expect(result.current.playingPartId).toBe("1");

    result.current.stop();
    await rerender();

    expect(speech.cancel).toHaveBeenCalled();
    expect(result.current.isMessagePlaying).toBe(false);
    expect(result.current.playingPartId).toBeNull();

    resolveSpeak?.();
    await playPromise;
  });

  test("does not advance to later steps after stop", async () => {
    let resolveFirstSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveFirstSpeak = () => endUtterance(utterance);
    });

    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "before", language: "en" },
      {
        kind: "tile",
        id: "2",
        label: "ding",
        language: "en",
        soundSrc: "ding.mp3",
      },
      { kind: "tile", id: "3", label: "after", language: "en" },
    ];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playParts(parts);
    await rerender();

    result.current.stop();
    resolveFirstSpeak?.();
    await playPromise;
    await rerender();

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(audio.play).not.toHaveBeenCalled();
    expect(result.current.playingPartId).toBeNull();
  });

  test("ignores a boundary event that arrives after stop", async () => {
    let fireBoundary: ((charIndex: number) => void) | undefined;
    let resolveSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      fireBoundary = (charIndex) =>
        reachUtteranceBoundary(utterance, charIndex);

      resolveSpeak = () => endUtterance(utterance);
    });

    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "I", language: "en" },
      { kind: "tile", id: "2", label: "want", language: "en" },
    ];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playParts(parts);
    await rerender();

    result.current.stop();
    fireBoundary?.(2);
    await rerender();
    expect(result.current.playingPartId).toBeNull();

    resolveSpeak?.();
    await playPromise;
  });

  test("aborts the playing message and speaks only the new one when another message plays", async () => {
    let resolveFirstSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveFirstSpeak = () => endUtterance(utterance);
    });
    speech.speak.mockImplementationOnce((utterance) => {
      queueMicrotask(() => endUtterance(utterance));
    });

    const { result, rerender } = await renderPlayback();

    const firstPlay = result.current.playParts([
      { kind: "tile", id: "1", label: "first", language: "en" },
    ]);
    const secondPlay = result.current.playParts([
      { kind: "tile", id: "2", label: "second", language: "en" },
    ]);

    resolveFirstSpeak?.();

    await expect(firstPlay).resolves.toBe(false);
    await expect(secondPlay).resolves.toBe(true);
    expect(speech.spokenTexts()).toEqual(["first", "second"]);
    await rerender();

    expect(page.getByRole("alert").elements()).toHaveLength(0);
  });

  test("reports a failed message once and resolves as not completed", async () => {
    failSpeech(speech.speak);
    const { result, rerender } = await renderPlayback();

    await expect(
      result.current.playParts([
        { kind: "tile", id: "1", label: "hi", language: "en" },
      ]),
    ).resolves.toBe(false);
    await rerender();

    expect(result.current.isMessagePlaying).toBe(false);
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Couldn't speak");
    expect(page.getByRole("alert").elements()).toHaveLength(1);
  });

  test("reports a failed tile once", async () => {
    failSpeech(speech.speak);
    const { result } = await renderPlayback();

    await result.current.playTile({
      kind: "tile",
      id: "1",
      label: "hi",
      language: "en",
    });

    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Couldn't speak");
    expect(page.getByRole("alert").elements()).toHaveLength(1);
  });

  test("reports a failure when only some of the message plays", async () => {
    failAudio(audio.play);
    const { result } = await renderPlayback();

    await expect(
      result.current.playParts([
        { kind: "tile", id: "1", label: "before", language: "en" },
        {
          kind: "tile",
          id: "2",
          label: "",
          language: "en",
          soundSrc: "ding.mp3",
        },
      ]),
    ).resolves.toBe(false);

    expect(speech.spokenTexts()).toEqual(["before"]);
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Couldn't speak");
    expect(page.getByRole("alert").elements()).toHaveLength(1);
  });

  test("speaks a tapped tile whose sound fails without reporting a failure", async () => {
    failAudio(audio.play);
    const { result, rerender } = await renderPlayback();

    await result.current.playTile({
      kind: "tile",
      id: "1",
      label: "Dog",
      language: "en",
      soundSrc: "bark.mp3",
    });
    await rerender();

    expect(speech.spokenTexts()).toEqual(["Dog"]);
    expect(page.getByRole("alert").elements()).toHaveLength(0);
  });

  test("speaks a tile in place of its failing sound when the message plays", async () => {
    failAudio(audio.play);
    const { result, rerender } = await renderPlayback();

    await expect(
      result.current.playParts([
        { kind: "tile", id: "1", label: "before", language: "en" },
        {
          kind: "tile",
          id: "2",
          label: "🐶",
          language: "en",
          vocalization: "Dog",
          soundSrc: "bark.mp3",
        },
        { kind: "tile", id: "3", label: "after", language: "en" },
      ]),
    ).resolves.toBe(true);
    await rerender();

    expect(speech.spokenTexts()).toEqual(["before", "Dog", "after"]);
    expect(page.getByRole("alert").elements()).toHaveLength(0);
  });

  test("highlights the part being spoken in place of its failing sound", async () => {
    failAudio(audio.play);
    preventSpeechEnd(speech.speak);
    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playParts([
      {
        kind: "tile",
        id: "1",
        label: "Dog",
        language: "en",
        soundSrc: "bark.mp3",
      },
    ]);
    await expect.poll(() => speech.spokenTexts()).toEqual(["Dog"]);
    await rerender();

    expect(result.current.playingPartId).toBe("1");

    result.current.stop();
    await playPromise;
  });

  test("reports a failure when a tile's sound and its speech both fail", async () => {
    failAudio(audio.play);
    failSpeech(speech.speak);
    const { result } = await renderPlayback();

    await result.current.playTile({
      kind: "tile",
      id: "1",
      label: "Dog",
      language: "en",
      soundSrc: "bark.mp3",
    });

    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Couldn't speak");
    expect(page.getByRole("alert").elements()).toHaveLength(1);
  });

  test("resolves as completed without reporting anything", async () => {
    const { result, rerender } = await renderPlayback();

    await expect(
      result.current.playParts([
        { kind: "tile", id: "1", label: "hi", language: "en" },
      ]),
    ).resolves.toBe(true);
    await rerender();

    expect(page.getByRole("alert").elements()).toHaveLength(0);
  });

  test("resolves a stopped message as not completed without reporting it", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playParts([
      { kind: "tile", id: "1", label: "hi", language: "en" },
    ]);
    result.current.stop();

    await expect(playPromise).resolves.toBe(false);
    await rerender();

    expect(page.getByRole("alert").elements()).toHaveLength(0);
  });
});
