import { setStoredLanguage } from "@shared/language/language-store";
import {
  setSpeechPitch,
  setSpeechRate,
  setSpeechVoiceURI,
  setSpeechVolume,
  SPEECH_RATE,
} from "@shared/speech/speech-store";
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

    test("resolves silently instead of throwing", async () => {
      await expect(speak("hello", "en")).resolves.toBeUndefined();
    });
  });

  describe("utterance mapping", () => {
    beforeEach(() => {
      stubVoices([{ voiceURI: "voice-1", name: "Voice One", lang: "en-US" }]);
    });

    test("maps the configured rate, pitch, volume, and voice onto the utterance", async () => {
      stubUtteranceVoiceAccessor();
      const speech = stubSpeech();
      setSpeechVoiceURI("voice-1");
      setSpeechRate(1.5);
      setSpeechPitch(0.5);
      setSpeechVolume(0.25);

      await speak("hi", "en");

      const utterance = speech.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(1.5);
      expect(utterance.pitch).toBe(0.5);
      expect(utterance.volume).toBe(0.25);
      expect(utterance.voice?.voiceURI).toBe("voice-1");
    });

    test("speaks in the text's language rather than the selected one", async () => {
      stubUtteranceVoiceAccessor();
      stubVoices([
        { voiceURI: "voice-1", name: "Voice One", lang: "en-US" },
        { voiceURI: "es-voice", name: "Mónica", lang: "es-ES" },
      ]);
      const speech = stubSpeech();
      setStoredLanguage("es");

      await speak("hello", "en");

      const utterance = speech.speak.mock.calls[0][0];
      expect(utterance.lang).toBe("en");
      expect(utterance.voice?.voiceURI).toBe("voice-1");
    });

    test("leaves the voice to the browser when the language has no voices", async () => {
      stubUtteranceVoiceAccessor();
      const speech = stubSpeech();
      setSpeechVoiceURI("voice-1");

      await speak("שלום", "he");

      const utterance = speech.speak.mock.calls[0][0];
      expect(utterance.voice).toBeNull();
      expect(utterance.lang).toBe("he");
    });

    test("speaks another language with its own voice and keeps the saved voice", async () => {
      stubUtteranceVoiceAccessor();
      stubVoices([
        { voiceURI: "voice-1", name: "Voice One", lang: "en-US" },
        { voiceURI: "he-voice", name: "Carmit", lang: "he-IL" },
      ]);
      const speech = stubSpeech();
      setSpeechVoiceURI("voice-1");

      await speak("שלום", "he");
      await speak("hello", "en");

      const [hebrew, english] = speech.speak.mock.calls.map(([call]) => call);
      expect(hebrew.voice?.voiceURI).toBe("he-voice");
      expect(english.voice?.voiceURI).toBe("voice-1");
    });

    test("clamps an out-of-range stored rate to the configured max", async () => {
      const speech = stubSpeech();
      localStorage.setItem("speech-preferences", JSON.stringify({ rate: 99 }));
      reloadPersistedStores();

      await speak("hi", "en");

      const utterance = speech.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(SPEECH_RATE.max);
    });
  });

  describe("lifecycle", () => {
    test("does not speak when the signal is already aborted", async () => {
      const speech = stubSpeech();

      await expect(
        speak("hello", "en", { signal: AbortSignal.abort() }),
      ).resolves.toBeUndefined();

      expect(speech.speak).not.toHaveBeenCalled();
    });

    test("cancels active speech and resolves when aborted", async () => {
      const speech = stubSpeech();
      speech.speak.mockImplementationOnce(() => undefined);
      const controller = new AbortController();

      const playback = speak("hello", "en", { signal: controller.signal });
      const cancelsBeforeAbort = speech.cancel.mock.calls.length;
      controller.abort();

      expect(speech.cancel.mock.calls.length).toBeGreaterThan(
        cancelsBeforeAbort,
      );
      await expect(playback).resolves.toBeUndefined();
    });

    test("resolves when speech synthesis fails", async () => {
      const speech = stubSpeech();
      let utterance: SpeechSynthesisUtterance | undefined;
      speech.speak.mockImplementationOnce((spoken) => {
        utterance = spoken;
      });
      const playback = speak("hello", "en");

      utterance?.dispatchEvent(
        new SpeechSynthesisErrorEvent("error", {
          utterance,
          error: "synthesis-failed",
        }),
      );

      await expect(playback).resolves.toBeUndefined();
    });
  });
});
