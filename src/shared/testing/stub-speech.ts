import { type MockInstance, vi } from "vitest";

export function stubSpeech(): {
  speak: MockInstance<SpeechSynthesis["speak"]>;
  cancel: MockInstance<SpeechSynthesis["cancel"]>;
  spokenTexts: () => string[];
} {
  const speak = vi
    .spyOn(speechSynthesis, "speak")
    .mockImplementation((utterance) => {
      queueMicrotask(() => {
        utterance.dispatchEvent(new SpeechSynthesisEvent("end", { utterance }));
      });
    });
  const cancel = vi.spyOn(speechSynthesis, "cancel").mockReturnValue(undefined);

  function spokenTexts(): string[] {
    return speak.mock.calls.map(([utterance]) => utterance.text);
  }

  return { speak, cancel, spokenTexts };
}

export function preventSpeechEnd(
  speak: MockInstance<SpeechSynthesis["speak"]>,
): void {
  speak.mockImplementation(() => undefined);
}

export function failSpeech(
  speak: MockInstance<SpeechSynthesis["speak"]>,
): void {
  speak.mockImplementation((utterance) => {
    queueMicrotask(() => {
      utterance.dispatchEvent(
        new SpeechSynthesisErrorEvent("error", {
          utterance,
          error: "synthesis-failed",
        }),
      );
    });
  });
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
  speechSynthesis.dispatchEvent(new Event("voiceschanged"));
}
