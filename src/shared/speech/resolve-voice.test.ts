import { describe, expect, test } from "vitest";
import { resolveVoice } from "./resolve-voice";

function makeVoice(
  lang: string,
  uri: string,
  isDefault = false,
): SpeechSynthesisVoice {
  return {
    lang,
    voiceURI: uri,
    name: uri,
    localService: true,
    default: isDefault,
  };
}

describe("resolveVoice", () => {
  test("returns nothing when the language has no voices", () => {
    expect(resolveVoice({}, "he", "en-voice", [])).toBeNull();
  });

  test("keeps the saved voice even when another voice is the default", () => {
    const voices = [
      makeVoice("en-US", "en-default", true),
      makeVoice("en-US", "en-voice"),
    ];

    expect(
      resolveVoice({ en: voices }, "en", "en-voice", ["en-US"])?.voiceURI,
    ).toBe("en-voice");
  });

  test("falls back when the saved voice belongs to another language", () => {
    const voicesByLanguage = {
      en: [makeVoice("en-US", "en-voice")],
      he: [makeVoice("he-IL", "he-voice")],
    };

    expect(resolveVoice(voicesByLanguage, "he", "en-voice", [])?.voiceURI).toBe(
      "he-voice",
    );
  });

  test("prefers the default voice when multiple voices exist for the language", () => {
    const voices = [
      makeVoice("en-US", "en-non-default"),
      makeVoice("en-US", "en-default", true),
    ];

    expect(resolveVoice({ en: voices }, "en", null, [])?.voiceURI).toBe(
      "en-default",
    );
  });

  test("prefers the language's likely region over the browser default flag", () => {
    const voices = [
      makeVoice("fr-CA", "fr-ca-default", true),
      makeVoice("fr-FR", "fr-fr-voice"),
    ];

    expect(resolveVoice({ fr: voices }, "fr", null, ["en-US"])?.voiceURI).toBe(
      "fr-fr-voice",
    );
  });

  test("prefers the region in the browser's preferred languages over the language's likely region", () => {
    const voices = [
      makeVoice("fr-FR", "fr-fr-voice"),
      makeVoice("fr-CA", "fr-ca-voice"),
    ];

    expect(resolveVoice({ fr: voices }, "fr", null, ["fr-CA"])?.voiceURI).toBe(
      "fr-ca-voice",
    );
  });

  test("skips a region-less preferred locale and uses the next one for the language", () => {
    const voices = [
      makeVoice("fr-FR", "fr-fr-voice"),
      makeVoice("fr-CA", "fr-ca-voice"),
    ];

    expect(
      resolveVoice({ fr: voices }, "fr", null, ["fr", "fr-CA"])?.voiceURI,
    ).toBe("fr-ca-voice");
  });

  test("falls back to the default voice when no voice matches the likely region", () => {
    const voices = [
      makeVoice("fr-CA", "fr-ca-voice"),
      makeVoice("fr-BE", "fr-be-default", true),
    ];

    expect(resolveVoice({ fr: voices }, "fr", null, ["en-US"])?.voiceURI).toBe(
      "fr-be-default",
    );
  });
});
