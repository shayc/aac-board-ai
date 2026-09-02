import { describe, expect, test } from "vitest";
import { parseSpeechConfig } from "./speech-store";

describe("speech-store", () => {
  describe("parseSpeechConfig", () => {
    test("uses defaults when the config is absent", () => {
      expect(parseSpeechConfig(undefined)).toEqual({
        voiceURI: null,
        rate: 1,
        pitch: 1,
        volume: 1,
      });
    });

    test("keeps valid stored values", () => {
      expect(
        parseSpeechConfig({
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
        parseSpeechConfig({
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
      ["volume", -1, 0],
      ["volume", 2, 1],
    ] as const)(
      "clamps %s values to their supported range",
      (key, value, expected) => {
        expect(parseSpeechConfig({ [key]: value })[key]).toBe(expected);
      },
    );
  });
});
