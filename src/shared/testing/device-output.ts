import { type MockInstance, vi } from "vitest";

// Stubs fire onend/ended via microtask so awaited callers can settle in tests.
// cancel/pause are no-op spies: suppress real side effects (a real pause fires onpause, flipping React state) and let tests assert the calls.

export function stubSpeech(): {
  speak: MockInstance<SpeechSynthesis["speak"]>;
  cancel: MockInstance<SpeechSynthesis["cancel"]>;
} {
  const speak = vi
    .spyOn(speechSynthesis, "speak")
    .mockImplementation((utterance) => {
      queueMicrotask(() => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      });
    });
  const cancel = vi.spyOn(speechSynthesis, "cancel").mockReturnValue(undefined);
  return { speak, cancel };
}

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
