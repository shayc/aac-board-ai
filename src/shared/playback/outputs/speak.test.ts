import type { SpeechSettings } from "@shared/speech/speech-synthesis";
import { assertDefined } from "@shared/testing/assert-defined";
import { stubSpeech } from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { speak } from "./speak";

const settings: SpeechSettings = {
  lang: "en",
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
};

// The native accessor rejects stub SpeechSynthesisVoice objects.
function stubUtteranceVoiceAccessor(): void {
  const voices = new WeakMap<
    SpeechSynthesisUtterance,
    SpeechSynthesisVoice | null
  >();

  vi.spyOn(
    SpeechSynthesisUtterance.prototype,
    "voice",
    "set",
  ).mockImplementation(function (this: SpeechSynthesisUtterance, value) {
    voices.set(this, value);
  });
  vi.spyOn(
    SpeechSynthesisUtterance.prototype,
    "voice",
    "get",
  ).mockImplementation(function (this: SpeechSynthesisUtterance) {
    return voices.get(this) ?? null;
  });
}

describe("speak", () => {
  describe("without the Web Speech API", () => {
    beforeEach(() => {
      vi.stubGlobal("speechSynthesis", undefined);
    });

    test("rejects because nothing can be spoken", async () => {
      await expect(speak("hello", settings)).rejects.toThrow(
        "Speech synthesis is unavailable",
      );
    });
  });

  test("maps the given settings onto the utterance", async () => {
    stubUtteranceVoiceAccessor();
    const speech = stubSpeech();
    const voice: SpeechSynthesisVoice = {
      voiceURI: "he-voice",
      name: "Carmit",
      lang: "he-IL",
      default: false,
      localService: true,
    };

    await speak("שלום", {
      lang: "he",
      voice,
      rate: 1.5,
      pitch: 0.5,
      volume: 0.25,
    });

    const utterance = speech.speak.mock.calls[0]?.[0];

    assertDefined(utterance);
    expect(utterance.lang).toBe("he");
    expect(utterance.voice).toBe(voice);
    expect(utterance.rate).toBe(1.5);
    expect(utterance.pitch).toBe(0.5);
    expect(utterance.volume).toBe(0.25);
  });

  describe("lifecycle", () => {
    test("does not speak when the signal is already aborted", async () => {
      const speech = stubSpeech();

      await expect(
        speak("hello", settings, { signal: AbortSignal.abort() }),
      ).resolves.toBeUndefined();

      expect(speech.speak).not.toHaveBeenCalled();
    });

    test("cancels active speech and resolves when aborted", async () => {
      const speech = stubSpeech();
      speech.speak.mockImplementationOnce(() => undefined);
      const controller = new AbortController();

      const playback = speak("hello", settings, { signal: controller.signal });
      const cancelsBeforeAbort = speech.cancel.mock.calls.length;
      controller.abort();

      expect(speech.cancel.mock.calls.length).toBeGreaterThan(
        cancelsBeforeAbort,
      );
      await expect(playback).resolves.toBeUndefined();
    });

    test("rejects when speech synthesis fails", async () => {
      const speech = stubSpeech();
      let utterance: SpeechSynthesisUtterance | undefined;
      speech.speak.mockImplementationOnce((spoken) => {
        utterance = spoken;
      });
      const playback = speak("hello", settings);

      utterance?.dispatchEvent(
        new SpeechSynthesisErrorEvent("error", {
          utterance,
          error: "synthesis-failed",
        }),
      );

      await expect(playback).rejects.toThrow("Speech failed: synthesis-failed");
    });
  });
});
