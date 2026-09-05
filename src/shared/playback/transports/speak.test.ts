import {
  setPitch,
  setRate,
  setVoiceURI,
  setVolume,
  SPEECH_RATE,
} from "@shared/speech/speech-store";
import { stubSpeech, stubVoices } from "@shared/testing/stub-speech";
import { reloadPersistedStores } from "@shared/utils/persisted-store";
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
    vi.stubGlobal("speechSynthesis", undefined);
  });

  test("reports unavailable speech as a failure", async () => {
    await expect(speak("hello")).resolves.toMatchObject({ status: "failed" });
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

  test("clamps an out-of-range stored rate to the configured max", async () => {
    const speech = stubSpeech();
    localStorage.setItem("speech-config", JSON.stringify({ rate: 99 }));
    reloadPersistedStores();

    await speak("hi");

    const utterance = speech.speak.mock.calls[0][0];
    expect(utterance.rate).toBe(SPEECH_RATE.max);
  });
});

describe("speak() lifecycle", () => {
  test.each(["canceled", "interrupted"] as const)(
    "reports platform %s as interruption",
    async (error) => {
      const speech = stubSpeech();
      speech.speak.mockImplementationOnce((utterance) => {
        utterance.onerror?.({ error } as SpeechSynthesisErrorEvent);
      });

      await expect(speak("hello")).resolves.toEqual({ status: "interrupted" });
    },
  );
  test("does not speak when the signal is already aborted", async () => {
    const speech = stubSpeech();

    await expect(
      speak("hello", { signal: AbortSignal.abort() }),
    ).resolves.toMatchObject({ status: "interrupted" });

    expect(speech.speak).not.toHaveBeenCalled();
  });

  test("cancels active speech and resolves when aborted", async () => {
    const speech = stubSpeech();
    speech.speak.mockImplementationOnce(() => undefined);
    const controller = new AbortController();

    const playback = speak("hello", { signal: controller.signal });
    const cancelsBeforeAbort = speech.cancel.mock.calls.length;
    controller.abort();

    expect(speech.cancel.mock.calls.length).toBeGreaterThan(cancelsBeforeAbort);
    await expect(playback).resolves.toMatchObject({ status: "interrupted" });
  });

  test("reports speech synthesis failure", async () => {
    const speech = stubSpeech();
    let utterance: SpeechSynthesisUtterance | undefined;
    speech.speak.mockImplementationOnce((spoken) => {
      utterance = spoken;
    });
    const playback = speak("hello");

    utterance?.onerror?.({
      error: "synthesis-failed",
    } as SpeechSynthesisErrorEvent);

    await expect(playback).resolves.toMatchObject({ status: "failed" });
  });
});
