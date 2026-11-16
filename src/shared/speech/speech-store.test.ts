import { setStoredLanguage } from "@shared/language/language-store";
import { stubVoices } from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test } from "vitest";
import {
  getSpeechParameters,
  parseSpeechPreferences,
  setSpeechPitch,
  setSpeechRate,
  setSpeechVoiceURI,
  setSpeechVolume,
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

  test("combines the saved voice, rate, pitch, and volume", () => {
    setSpeechVoiceURI("voice-2");
    setSpeechRate(1.5);
    setSpeechPitch(0.5);
    setSpeechVolume(0.25);

    expect(getSpeechParameters("en")).toMatchObject({
      voice: { voiceURI: "voice-2" },
      rate: 1.5,
      pitch: 0.5,
      volume: 0.25,
    });
  });

  test("gives each language its own voice and keeps the saved voice for the language it speaks", () => {
    setSpeechVoiceURI("voice-2");

    expect(getSpeechParameters("he").voice?.voiceURI).toBe("he-voice");
    expect(getSpeechParameters("en").voice?.voiceURI).toBe("voice-2");
  });

  test("follows the given language, not the communication language", () => {
    setStoredLanguage("he");
    setSpeechVoiceURI("he-voice");

    expect(getSpeechParameters("en").voice?.voiceURI).toBe("voice-1");
  });

  test("leaves the voice to the browser when the language has no voices", () => {
    setSpeechVoiceURI("voice-2");

    expect(getSpeechParameters("fr").voice).toBeNull();
  });
});
