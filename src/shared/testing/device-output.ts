import { vi } from "vitest";

// Stubs fire onend/ended via microtask so awaited callers can settle in tests.
// cancel/pause are also stubbed: real device output calls them during lifecycle, causing spurious AbortErrors.

export function stubSpeech() {
  const cancel = vi.spyOn(speechSynthesis, "cancel").mockReturnValue(undefined);
  const speak = vi
    .spyOn(speechSynthesis, "speak")
    .mockImplementation((utterance) => {
      queueMicrotask(() => {
        utterance.onend?.({ utterance } as unknown as SpeechSynthesisEvent);
      });
    });
  return { speak, cancel };
}

export function stubAudio() {
  const pause = vi
    .spyOn(HTMLAudioElement.prototype, "pause")
    .mockReturnValue(undefined);

  const play = vi
    .spyOn(HTMLAudioElement.prototype, "play")
    .mockImplementation(function (this: HTMLAudioElement) {
      queueMicrotask(() => {
        this.dispatchEvent(new Event("play"));
        this.dispatchEvent(new Event("ended"));
      });
      return Promise.resolve();
    });
  return { play, pause };
}
