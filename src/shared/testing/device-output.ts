import { type MockInstance, vi } from "vitest";

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

export interface StubVoice {
  voiceURI: string;
  name: string;
  lang: string;
}

export function stubVoices(voices: StubVoice[]): void {
  const synthesisVoices = voices.map((voice) => ({
    default: false,
    localService: true,
    ...voice,
  }));

  vi.spyOn(speechSynthesis, "getVoices").mockReturnValue(synthesisVoices);
  // The speech store rebuilds its voice catalog on this event.
  speechSynthesis.dispatchEvent(new Event("voiceschanged"));
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
