import { stubAudio } from "@shared/testing/stub-audio";
import { beforeEach, describe, expect, test } from "vitest";
import { playAudio } from "./play-audio";

function pendingPlayback(audio: ReturnType<typeof stubAudio>) {
  audio.play.mockImplementation(function (this: HTMLAudioElement) {
    queueMicrotask(() => this.dispatchEvent(new Event("play")));

    return Promise.resolve();
  });
}

describe("playAudio transport", () => {
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    audio = stubAudio();
  });

  test("releases a local recording URL when playback fails", async () => {
    let url = "";
    audio.play.mockImplementation(function (this: HTMLAudioElement) {
      url = this.src;
      return Promise.reject(new Error("Blocked"));
    });

    await expect(playAudio(new Blob(["recording"]))).resolves.toMatchObject({
      status: "failed",
    });
    expect(url).toMatch(/^blob:/);
    await expect(fetch(url)).rejects.toThrow();
  });

  test("plays a url and resolves when the clip ends", async () => {
    await expect(playAudio("bell.mp3")).resolves.toEqual({
      status: "completed",
    });
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  test("resolves and stops playback when the signal aborts", async () => {
    pendingPlayback(audio);
    const controller = new AbortController();
    const promise = playAudio("a.mp3", { signal: controller.signal });

    controller.abort();

    await expect(promise).resolves.toEqual({ status: "interrupted" });
    expect(audio.pause).toHaveBeenCalled();
  });

  test("resolves without playing when the signal is already aborted", async () => {
    await expect(
      playAudio("a.mp3", { signal: AbortSignal.abort() }),
    ).resolves.toEqual({ status: "interrupted" });
    expect(audio.play).not.toHaveBeenCalled();
  });

  test("resolves when the element reports a media error", async () => {
    audio.play.mockImplementation(function (this: HTMLAudioElement) {
      queueMicrotask(() => this.dispatchEvent(new Event("error")));

      return Promise.resolve();
    });

    await expect(playAudio("boom.mp3")).resolves.toMatchObject({
      status: "failed",
    });
  });

  test("resolves when playback is blocked", async () => {
    audio.play.mockImplementation(() =>
      Promise.reject(new Error("NotAllowedError")),
    );

    await expect(playAudio("a.mp3")).resolves.toMatchObject({
      status: "failed",
    });
  });
});
