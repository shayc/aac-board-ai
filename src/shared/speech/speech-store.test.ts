import { describe, expect, test } from "vitest";
import { parseSpeechPreferences } from "./speech-store";

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
