import { type MockInstance, vi } from "vitest";
import { assertDefined } from "./assert-defined";

export function stubSpeech(): {
  speak: MockInstance<SpeechSynthesis["speak"]>;
  cancel: MockInstance<SpeechSynthesis["cancel"]>;
  spokenTexts: () => string[];
} {
  const speak = vi
    .spyOn(speechSynthesis, "speak")
    .mockImplementation((utterance) => {
      queueMicrotask(() => endUtterance(utterance));
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
    queueMicrotask(() => failUtterance(utterance));
  });
}

export function lastUtterance(
  speak: MockInstance<SpeechSynthesis["speak"]>,
): SpeechSynthesisUtterance {
  const utterance = speak.mock.lastCall?.[0];
  assertDefined(utterance);

  return utterance;
}

export function endUtterance(utterance: SpeechSynthesisUtterance): void {
  utterance.dispatchEvent(new SpeechSynthesisEvent("end", { utterance }));
}

export function failUtterance(utterance: SpeechSynthesisUtterance): void {
  utterance.dispatchEvent(
    new SpeechSynthesisErrorEvent("error", {
      utterance,
      error: "synthesis-failed",
    }),
  );
}

export function reachUtteranceBoundary(
  utterance: SpeechSynthesisUtterance,
  charIndex: number,
  name = "word",
): void {
  utterance.dispatchEvent(
    new SpeechSynthesisEvent("boundary", { utterance, charIndex, name }),
  );
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
