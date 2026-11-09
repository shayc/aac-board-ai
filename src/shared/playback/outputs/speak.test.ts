import { setStoredLanguage } from "@shared/language/language-store";
import {
  setSpeechPitch,
  setSpeechRate,
  setSpeechVoiceURI,
  setSpeechVolume,
  SPEECH_RATE,
} from "@shared/speech/speech-store";
import { assertDefined } from "@shared/testing/assert-defined";
import { stubSpeech, stubVoices } from "@shared/testing/stub-speech";
import { reloadPersistedStores } from "@shared/state/persisted-store";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { speak } from "./speak";

// Stub voices are not native SpeechSynthesisVoice objects, so replace the
// accessor to test voice selection.
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
      await expect(speak("hello")).rejects.toThrow(
        "Speech synthesis is unavailable",
      );
    });
  });

  describe("utterance mapping", () => {
    beforeEach(() => {
      stubVoices([{ voiceURI: "voice-1", name: "Voice One", lang: "en-US" }]);
    });

    test("maps the configured rate, pitch, volume, and voice onto the utterance", async () => {
      stubUtteranceVoiceAccessor();
      const speech = stubSpeech();
      setStoredLanguage("en");
      setSpeechVoiceURI("voice-1");
      setSpeechRate(1.5);
      setSpeechPitch(0.5);
      setSpeechVolume(0.25);

      await speak("hi");

      const utterance = speech.speak.mock.calls[0]?.[0];

      assertDefined(utterance);
      expect(utterance.rate).toBe(1.5);
      expect(utterance.pitch).toBe(0.5);
      expect(utterance.volume).toBe(0.25);
      expect(utterance.voice?.voiceURI).toBe("voice-1");
    });

    test("leaves the voice to the browser when the language has no voices", async () => {
      stubUtteranceVoiceAccessor();
      const speech = stubSpeech();
      setStoredLanguage("en");
      setSpeechVoiceURI("voice-1");
      setStoredLanguage("he");

      await speak("שלום");

      const utterance = speech.speak.mock.calls[0]?.[0];

      assertDefined(utterance);
      expect(utterance.voice).toBeNull();
      expect(utterance.lang).toBe("he");
    });

    test("speaks a new language with its own voice and keeps the saved voice", async () => {
      stubUtteranceVoiceAccessor();
      stubVoices([
        { voiceURI: "voice-1", name: "Voice One", lang: "en-US" },
        { voiceURI: "he-voice", name: "Carmit", lang: "he-IL" },
      ]);
      const speech = stubSpeech();
      setStoredLanguage("en");
      setSpeechVoiceURI("voice-1");
      setStoredLanguage("he");

      await speak("שלום");
      setStoredLanguage("en");
      await speak("hello");

      const [hebrew, english] = speech.speak.mock.calls.map(([call]) => call);
      expect(hebrew?.voice?.voiceURI).toBe("he-voice");
      expect(english?.voice?.voiceURI).toBe("voice-1");
    });

    test("clamps an out-of-range stored rate to the configured max", async () => {
      const speech = stubSpeech();
      localStorage.setItem("speech-preferences", JSON.stringify({ rate: 99 }));
      reloadPersistedStores();

      await speak("hi");

      const utterance = speech.speak.mock.calls[0]?.[0];

      assertDefined(utterance);
      expect(utterance.rate).toBe(SPEECH_RATE.max);
    });
  });

  describe("lifecycle", () => {
    test("does not speak when the signal is already aborted", async () => {
      const speech = stubSpeech();

      await expect(
        speak("hello", { signal: AbortSignal.abort() }),
      ).resolves.toBeUndefined();

      expect(speech.speak).not.toHaveBeenCalled();
    });

    test("cancels active speech and resolves when aborted", async () => {
      const speech = stubSpeech();
      speech.speak.mockImplementationOnce(() => undefined);
      const controller = new AbortController();

      const playback = speak("hello", { signal: controller.signal });
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
      const playback = speak("hello");

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
