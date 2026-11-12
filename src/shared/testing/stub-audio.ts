import { type MockInstance, vi } from "vitest";

export function stubAudio(): {
  play: MockInstance<HTMLAudioElement["play"]>;
  pause: MockInstance<HTMLAudioElement["pause"]>;
} {
  const play = vi
    .spyOn(HTMLAudioElement.prototype, "play")
    .mockImplementation(function (this: HTMLAudioElement) {
      queueMicrotask(() => {
        this.dispatchEvent(new Event("play"));
        this.dispatchEvent(new Event("ended"));
      });

      return Promise.resolve();
    });
  const pause = vi
    .spyOn(HTMLAudioElement.prototype, "pause")
    .mockReturnValue(undefined);

  return { play, pause };
}
