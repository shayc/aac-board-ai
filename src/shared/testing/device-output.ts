import { vi } from "vitest";

// Real speak()/play() resolve via utterance.onend / audio.onended; the spies
// trigger those events via microtask so awaited callers can settle in tests.
// cancel/pause are stubbed alongside because the real hooks call them as part
// of their start/stop lifecycle, and exercising them on real device output
// causes spurious AbortErrors in browser-mode tests.

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
