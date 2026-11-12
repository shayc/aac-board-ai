import { setStoredLanguage } from "@shared/language/language-store";
import { reloadPersistedStores } from "@shared/state/persisted-store";
import { stubVoices } from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test } from "vitest";
import {
  getSpeechParameters,
  parseSpeechPreferences,
  setSpeechPitch,
  setSpeechRate,
  setSpeechVoiceURI,
  setSpeechVolume,
  SPEECH_RATE_RANGE,
} from "./speech-store";

describe("parseSpeechPreferences", () => {
  test("uses defaults when the preferences are absent", () => {
    expect(parseSpeechPreferences(undefined)).toEqual({
      voiceURI: null,
      rate: 1,
      pitch: 1,
      volume: 1,
    });
  });

  test("keeps valid stored values", () => {
    expect(
      parseSpeechPreferences({
        voiceURI: "voice-1",
        rate: 1.2,
        pitch: 0.8,
        volume: 0.6,
      }),
    ).toEqual({
      voiceURI: "voice-1",
      rate: 1.2,
      pitch: 0.8,
      volume: 0.6,
    });
  });

  test("ignores invalid stored values", () => {
    expect(
      parseSpeechPreferences({
        voiceURI: false,
        rate: "fast",
        pitch: NaN,
        volume: null,
      }),
    ).toEqual({
      voiceURI: null,
      rate: 1,
      pitch: 1,
      volume: 1,
    });
  });

  test.each([
    ["rate", -1, 0.1],
    ["rate", 3, 2],
    ["pitch", -1, 0.1],
    ["pitch", 3, 2],
    ["volume", 0, 0.1],
    ["volume", 2, 1],
  ] as const)(
    "clamps %s values to their supported range",
    (key, value, expected) => {
      expect(parseSpeechPreferences({ [key]: value })[key]).toBe(expected);
    },
  );
});

describe("getSpeechParameters", () => {
  beforeEach(() => {
    stubVoices([
      { voiceURI: "voice-1", name: "Voice One", lang: "en-US" },
      { voiceURI: "voice-2", name: "Voice Two", lang: "en-US" },
      { voiceURI: "he-voice", name: "Carmit", lang: "he-IL" },
    ]);
  });

  test("combines the stored language with the saved voice, rate, pitch, and volume", () => {
    setStoredLanguage("en");
    setSpeechVoiceURI("voice-2");
    setSpeechRate(1.5);
    setSpeechPitch(0.5);
    setSpeechVolume(0.25);

    expect(getSpeechParameters()).toMatchObject({
      language: "en",
      voice: { voiceURI: "voice-2" },
      rate: 1.5,
      pitch: 0.5,
      volume: 0.25,
    });
  });

  test("leaves the voice to the browser when the language has no voices", () => {
    setSpeechVoiceURI("voice-2");
    setStoredLanguage("fr");

    expect(getSpeechParameters()).toMatchObject({
      language: "fr",
      voice: null,
    });
  });

  test("gives a new language its own voice and keeps the saved voice", () => {
    setStoredLanguage("en");
    setSpeechVoiceURI("voice-2");

    setStoredLanguage("he");
    expect(getSpeechParameters().voice?.voiceURI).toBe("he-voice");

    setStoredLanguage("en");
    expect(getSpeechParameters().voice?.voiceURI).toBe("voice-2");
  });

  test("clamps an out-of-range stored rate to the configured max", () => {
    localStorage.setItem("speech-preferences", JSON.stringify({ rate: 99 }));
    reloadPersistedStores();

    expect(getSpeechParameters().rate).toBe(SPEECH_RATE_RANGE.max);
  });
});
