import { stubSpeech, stubVoices } from "@shared/testing/stub-speech";
import { reloadPersistedStores } from "@shared/utils/persisted-store";
import {
  setPitch,
  setRate,
  setVoiceURI,
  setVolume,
  SPEECH_RATE,
} from "@shared/speech/speech-store";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { speak } from "./speak";

// Real SpeechSynthesisUtterance rejects assigning a `.voice` that isn't a
// platform-native SpeechSynthesisVoice, so stubbed voice objects can't be
// assigned directly. Replace the native accessor with a plain in-memory one
// so buildUtterance's voice-matching logic can be observed; restoreMocks in
// vite.config restores the native accessor after each test.
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

describe("speak() without Web Speech API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("speechSynthesis", undefined);
  });

  test("speak() resolves silently instead of throwing", async () => {
    const { speak } = await import("./speak");
    await expect(speak("hello")).resolves.toBeUndefined();
  });
});

describe("speak() utterance mapping", () => {
  beforeEach(() => {
    stubVoices([{ voiceURI: "voice-1", name: "Voice One", lang: "en-US" }]);
  });

  test("maps the configured rate, pitch, volume, and voice onto the utterance", async () => {
    stubUtteranceVoiceAccessor();
    const speech = stubSpeech();
    setVoiceURI("voice-1");
    setRate(1.5);
    setPitch(0.5);
    setVolume(0.25);

    await speak("hi");

    const utterance = speech.speak.mock.calls[0][0];
    expect(utterance.rate).toBe(1.5);
    expect(utterance.pitch).toBe(0.5);
    expect(utterance.volume).toBe(0.25);
    expect(utterance.voice?.voiceURI).toBe("voice-1");
  });

  test("clamps a malformed stored rate to the configured max", async () => {
    const speech = stubSpeech();
    localStorage.setItem("speech-config", JSON.stringify({ rate: 99 }));
    reloadPersistedStores();

    await speak("hi");

    const utterance = speech.speak.mock.calls[0][0];
    expect(utterance.rate).toBe(SPEECH_RATE.max);
  });
});
