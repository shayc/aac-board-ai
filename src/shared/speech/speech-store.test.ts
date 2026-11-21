import { setCommunicationLanguage } from "@shared/language/language-store";
import { stubVoices } from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test } from "vitest";
import {
  getSpeechParameters,
  parseSpeechPreferences,
  setSpeechPitch,
  setSpeechRate,
  setSpeechVoice,
  setSpeechVolume,
} from "./speech-store";

describe("parseSpeechPreferences", () => {
  test("uses defaults when the preferences are absent", () => {
    expect(parseSpeechPreferences(undefined)).toEqual({
      voiceURIs: {},
      rate: 1,
      pitch: 1,
      volume: 1,
    });
  });

  test("keeps valid stored values", () => {
    expect(
      parseSpeechPreferences({
        voiceURIs: { en: "voice-1", he: "he-voice" },
        rate: 1.2,
        pitch: 0.8,
        volume: 0.6,
      }),
    ).toEqual({
      voiceURIs: { en: "voice-1", he: "he-voice" },
      rate: 1.2,
      pitch: 0.8,
      volume: 0.6,
    });
  });

  test("ignores invalid stored values", () => {
    expect(
      parseSpeechPreferences({
        voiceURIs: "voice-1",
        rate: "fast",
        pitch: NaN,
        volume: null,
      }),
    ).toEqual({
      voiceURIs: {},
      rate: 1,
      pitch: 1,
      volume: 1,
    });
  });

  test("drops saved voices that are not voice URIs", () => {
    expect(
      parseSpeechPreferences({
        voiceURIs: { en: "voice-1", he: 7, fr: null },
      }).voiceURIs,
    ).toEqual({ en: "voice-1" });
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
    setSpeechVoice("en", "voice-2");
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

  test("keeps a saved voice for each language", () => {
    setSpeechVoice("en", "voice-2");
    setSpeechVoice("he", "he-voice");

    expect(getSpeechParameters("en").voice?.voiceURI).toBe("voice-2");
    expect(getSpeechParameters("he").voice?.voiceURI).toBe("he-voice");
  });

  test("falls back to a voice of the language when none is saved for it", () => {
    setSpeechVoice("en", "voice-2");

    expect(getSpeechParameters("he").voice?.voiceURI).toBe("he-voice");
  });

  test("follows the given language, not the communication language", () => {
    setCommunicationLanguage("he");
    setSpeechVoice("he", "he-voice");
    setSpeechVoice("en", "voice-2");

    expect(getSpeechParameters("en").voice?.voiceURI).toBe("voice-2");
  });

  test("leaves the voice to the browser when the language has no voices", () => {
    setSpeechVoice("en", "voice-2");

    expect(getSpeechParameters("fr").voice).toBeNull();
  });
});
