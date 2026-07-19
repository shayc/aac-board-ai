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

export function preventSpeechEnd(
  speak: MockInstance<SpeechSynthesis["speak"]>,
): void {
  speak.mockImplementation(() => undefined);
}

interface StubVoice {
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
