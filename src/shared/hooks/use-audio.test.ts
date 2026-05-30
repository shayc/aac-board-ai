import { stubAudio } from "@shared/testing/device-output";
import { beforeEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useAudio } from "./use-audio";

describe("useAudio", () => {
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    audio = stubAudio();
  });

  test("plays a url and resolves when the clip ends", async () => {
    const { result } = await renderHook(() => useAudio());

    await expect(result.current.play("bell.mp3")).resolves.toBeUndefined();
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  test("returns to a fully idle state when an error interrupts a paused clip", async () => {
    // Drive the sequence the bug needed: a pause (isPaused -> true) immediately
    // followed by an error. The error exit must clear isPaused too, or the hook
    // reports "paused" with nothing loaded.
    audio.play.mockImplementation(function (this: HTMLAudioElement) {
      queueMicrotask(() => {
        this.dispatchEvent(new Event("play"));
        this.dispatchEvent(new Event("pause"));
        this.dispatchEvent(new Event("error"));
      });

      return Promise.resolve();
    });

    const { result, rerender } = await renderHook(() => useAudio());

    await expect(result.current.play("boom.mp3")).rejects.toThrow();
    await rerender();

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });
});
