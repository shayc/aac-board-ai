import { AppProviders } from "@shared/providers/app-providers";
import { failAudio, stubAudio } from "@shared/testing/stub-audio";
import {
  endUtterance,
  failSpeech,
  preventSpeechEnd,
  reachUtteranceBoundary,
  stubSpeech,
} from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { page } from "vitest/browser";
import type { MessagePart } from "../message/message-types";
import { useActiveMessagePartId, useBoardPlayback } from "./use-board-playback";

type PlaybackOptions = Parameters<typeof useBoardPlayback>[0];

function renderPlayback(options?: PlaybackOptions) {
  return renderHook(
    () => ({
      ...useBoardPlayback(options),
      activePartId: useActiveMessagePartId(),
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

  test("tracks playing state and active parts through speech boundaries and completion", async () => {
    let fireBoundary: ((charIndex: number) => void) | undefined;
    let endSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      fireBoundary = (charIndex) =>
        reachUtteranceBoundary(utterance, charIndex);

      endSpeak = () => endUtterance(utterance);
    });

    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "I" },
      { kind: "tile", id: "2", label: "want" },
    ];

    const { result, rerender } = await renderPlayback();

    expect(result.current.isMessagePlaying).toBe(false);
    expect(result.current.activePartId).toBeNull();

    const playPromise = result.current.playMessage(parts);
    await rerender();
    expect(result.current.isMessagePlaying).toBe(true);
    expect(result.current.activePartId).toBe("1");

    fireBoundary?.(2); // "want" begins at offset 2 in "i want"
    await rerender();
    expect(result.current.isMessagePlaying).toBe(true);
    expect(result.current.activePartId).toBe("2");

    endSpeak?.();
    await playPromise;
    await rerender();
    expect(result.current.isMessagePlaying).toBe(false);
    expect(result.current.activePartId).toBeNull();
  });

  test("interleaves speech and audio in order when a sound breaks a text run", async () => {
    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "before" },
      { kind: "tile", id: "2", label: "ding", soundSrc: "ding.mp3" },
      { kind: "tile", id: "3", label: "after" },
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

    await result.current.playMessage(parts);

    expect(callOrder).toEqual(["speak:before", "play:ding.mp3", "speak:after"]);
  });

  test("does not present tile speech as message playback", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playPart({
      kind: "tile",
      id: "1",
      label: "hi",
    });
    await rerender();

    expect(result.current.isMessagePlaying).toBe(false);
    expect(result.current.activePartId).toBeNull();

    result.current.stop();
    await playPromise;
  });

  test("cancels speech and clears playing and active-part state on stop", async () => {
    let resolveSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      reachUtteranceBoundary(utterance, 0);
      resolveSpeak = () => endUtterance(utterance);
    });

    const parts: MessagePart[] = [{ kind: "tile", id: "1", label: "hi" }];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage(parts);
    await rerender();
    expect(result.current.isMessagePlaying).toBe(true);
    expect(result.current.activePartId).toBe("1");

    result.current.stop();
    await rerender();

    expect(speech.cancel).toHaveBeenCalled();
    expect(result.current.isMessagePlaying).toBe(false);
    expect(result.current.activePartId).toBeNull();

    resolveSpeak?.();
    await playPromise;
  });

  test("does not advance to later segments after stop", async () => {
    let resolveFirstSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveFirstSpeak = () => endUtterance(utterance);
    });

    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "before" },
      { kind: "tile", id: "2", label: "ding", soundSrc: "ding.mp3" },
      { kind: "tile", id: "3", label: "after" },
    ];

    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage(parts);
    await rerender();

    result.current.stop();
    resolveFirstSpeak?.();
    await playPromise;
    await rerender();

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(audio.play).not.toHaveBeenCalled();
    expect(result.current.activePartId).toBeNull();
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
      { kind: "tile", id: "1", label: "I" },
      { kind: "tile", id: "2", label: "want" },
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

  test("aborts the playing message and speaks only the new one when playMessage() is called again", async () => {
    let resolveFirstSpeak: (() => void) | undefined;
    speech.speak.mockImplementationOnce((utterance) => {
      resolveFirstSpeak = () => endUtterance(utterance);
    });
    speech.speak.mockImplementationOnce((utterance) => {
      queueMicrotask(() => endUtterance(utterance));
    });

    const { result, rerender } = await renderPlayback();

    const firstPlay = result.current.playMessage([
      { kind: "tile", id: "1", label: "first" },
    ]);
    const secondPlay = result.current.playMessage([
      { kind: "tile", id: "2", label: "second" },
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
      result.current.playMessage([{ kind: "tile", id: "1", label: "hi" }]),
    ).resolves.toBe(false);
    await rerender();

    expect(result.current.isMessagePlaying).toBe(false);
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Couldn't play sound");
    expect(page.getByRole("alert").elements()).toHaveLength(1);
  });

  test("reports a failed tile once", async () => {
    failSpeech(speech.speak);
    const { result } = await renderPlayback();

    await result.current.playPart({ kind: "tile", id: "1", label: "hi" });

    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Couldn't play sound");
    expect(page.getByRole("alert").elements()).toHaveLength(1);
  });

  test("reports a failure when only some of the message plays", async () => {
    failAudio(audio.play);
    const { result } = await renderPlayback();

    await expect(
      result.current.playMessage([
        { kind: "tile", id: "1", label: "before" },
        { kind: "tile", id: "2", label: "", soundSrc: "ding.mp3" },
      ]),
    ).resolves.toBe(false);

    expect(speech.spokenTexts()).toEqual(["before"]);
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Couldn't play sound");
    expect(page.getByRole("alert").elements()).toHaveLength(1);
  });

  test("speaks a tapped tile whose recording fails without reporting a failure", async () => {
    failAudio(audio.play);
    const { result, rerender } = await renderPlayback();

    await result.current.playPart({
      kind: "tile",
      id: "1",
      label: "Dog",
      soundSrc: "bark.mp3",
    });
    await rerender();

    expect(speech.spokenTexts()).toEqual(["dog"]);
    expect(page.getByRole("alert").elements()).toHaveLength(0);
  });

  test("speaks a failing recording in its place when the message plays", async () => {
    failAudio(audio.play);
    const { result, rerender } = await renderPlayback();

    await expect(
      result.current.playMessage([
        { kind: "tile", id: "1", label: "before" },
        {
          kind: "tile",
          id: "2",
          label: "🐶",
          vocalization: "Dog",
          soundSrc: "bark.mp3",
        },
        { kind: "tile", id: "3", label: "after" },
      ]),
    ).resolves.toBe(true);
    await rerender();

    expect(speech.spokenTexts()).toEqual(["before", "dog", "after"]);
    expect(page.getByRole("alert").elements()).toHaveLength(0);
  });

  test("highlights the part whose failing recording is being spoken", async () => {
    failAudio(audio.play);
    preventSpeechEnd(speech.speak);
    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage([
      { kind: "tile", id: "1", label: "Dog", soundSrc: "bark.mp3" },
    ]);
    await expect.poll(() => speech.spokenTexts()).toEqual(["dog"]);
    await rerender();

    expect(result.current.activePartId).toBe("1");

    result.current.stop();
    await playPromise;
  });

  test("reports a failure when the recording and its spoken text both fail", async () => {
    failAudio(audio.play);
    failSpeech(speech.speak);
    const { result } = await renderPlayback();

    await result.current.playPart({
      kind: "tile",
      id: "1",
      label: "Dog",
      soundSrc: "bark.mp3",
    });

    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("Couldn't play sound");
    expect(page.getByRole("alert").elements()).toHaveLength(1);
  });

  test("resolves as completed without reporting anything", async () => {
    const { result, rerender } = await renderPlayback();

    await expect(
      result.current.playMessage([{ kind: "tile", id: "1", label: "hi" }]),
    ).resolves.toBe(true);
    await rerender();

    expect(page.getByRole("alert").elements()).toHaveLength(0);
  });

  test("resolves a stopped message as not completed without reporting it", async () => {
    speech.speak.mockImplementationOnce(() => undefined);
    const { result, rerender } = await renderPlayback();

    const playPromise = result.current.playMessage([
      { kind: "tile", id: "1", label: "hi" },
    ]);
    result.current.stop();

    await expect(playPromise).resolves.toBe(false);
    await rerender();

    expect(page.getByRole("alert").elements()).toHaveLength(0);
  });

  test("reports a played message with its completion", async () => {
    const onMessagePlayback =
      vi.fn<NonNullable<NonNullable<PlaybackOptions>["onMessagePlayback"]>>();
    const parts: MessagePart[] = [{ kind: "tile", id: "1", label: "hi" }];
    const { result } = await renderPlayback({ onMessagePlayback });

    await result.current.playMessage(parts);

    expect(onMessagePlayback).toHaveBeenCalledOnce();
    const [completion] = onMessagePlayback.mock.calls[0] ?? [];
    await expect(completion).resolves.toBe(true);
  });

  test("plays an echoed message without reporting it", async () => {
    const onMessagePlayback = vi.fn();
    const { result } = await renderPlayback({ onMessagePlayback });

    await expect(
      result.current.echoMessage([{ kind: "tile", id: "1", label: "hi" }]),
    ).resolves.toBe(true);

    expect(speech.spokenTexts()).toEqual(["hi"]);
    expect(onMessagePlayback).not.toHaveBeenCalled();
  });
});
