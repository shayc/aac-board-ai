import { stubAudio } from "@shared/testing/stub-audio";
import { beforeEach, describe, expect, test } from "vitest";
import { playAudio } from "./play-audio";

function preventAudioEnd(audio: ReturnType<typeof stubAudio>) {
  audio.play.mockImplementation(function (this: HTMLAudioElement) {
    queueMicrotask(() => this.dispatchEvent(new Event("play")));

    return Promise.resolve();
  });
}

describe("playAudio", () => {
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    audio = stubAudio();
  });

  test("plays a url and resolves when the clip ends", async () => {
    await expect(playAudio("bell.mp3")).resolves.toBeUndefined();
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  test("resolves and stops playback when the signal aborts", async () => {
    preventAudioEnd(audio);
    const controller = new AbortController();
    const promise = playAudio("a.mp3", { signal: controller.signal });

    controller.abort();

    await expect(promise).resolves.toBeUndefined();
    expect(audio.pause).toHaveBeenCalled();
  });

  test("resolves without playing when the signal is already aborted", async () => {
    await expect(
      playAudio("a.mp3", { signal: AbortSignal.abort() }),
    ).resolves.toBeUndefined();
    expect(audio.play).not.toHaveBeenCalled();
  });

  test("rejects when the element reports a media error", async () => {
    audio.play.mockImplementation(function (this: HTMLAudioElement) {
      queueMicrotask(() => this.dispatchEvent(new Event("error")));

      return Promise.resolve();
    });

    await expect(playAudio("boom.mp3")).rejects.toThrow("Audio failed to play");
  });

  test("rejects when playback is blocked", async () => {
    audio.play.mockImplementation(() =>
      Promise.reject(new Error("NotAllowedError")),
    );

    await expect(playAudio("a.mp3")).rejects.toThrow("Audio failed to play");
  });
});
