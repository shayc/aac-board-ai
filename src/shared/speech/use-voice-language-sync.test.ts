import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { getSpeechConfig, setVoiceURI } from "./speech-store";
import { useVoiceLanguageSync } from "./use-voice-language-sync";

function stubLanguages(languages: readonly string[]): void {
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    get: () => languages,
  });
}

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

describe("useVoiceLanguageSync", () => {
  beforeEach(() => {
    vi.spyOn(speechSynthesis, "getVoices").mockReturnValue([
      makeVoice("en-US", "en-voice"),
      makeVoice("he-IL", "he-voice"),
    ]);
    speechSynthesis.dispatchEvent(new Event("voiceschanged"));
    setVoiceURI(null);
  });

  afterEach(() => {
    // Drop the instance override so the real navigator.languages getter returns.
    Reflect.deleteProperty(navigator, "languages");
  });

  test("selects a voice in the new language when language changes", async () => {
    const { rerender } = await renderHook(
      ({ language }: { language: string } = { language: "en" }) =>
        useVoiceLanguageSync({ language }),
      { initialProps: { language: "en" } },
    );

    await vi.waitFor(() => {
      expect(getSpeechConfig().voiceURI).toBe("en-voice");
    });

    await rerender({ language: "he" });

    await vi.waitFor(() => {
      expect(getSpeechConfig().voiceURI).toBe("he-voice");
    });
  });

  test("keeps the current voice when it already matches the language", async () => {
    setVoiceURI("en-voice");

    await renderHook(() => useVoiceLanguageSync({ language: "en" }));

    expect(getSpeechConfig().voiceURI).toBe("en-voice");
  });

  test("prefers the default voice when multiple voices exist for the language", async () => {
    vi.spyOn(speechSynthesis, "getVoices").mockReturnValue([
      makeVoice("en-US", "en-non-default"),
      makeVoice("en-US", "en-default", true),
    ]);
    speechSynthesis.dispatchEvent(new Event("voiceschanged"));

    await renderHook(() => useVoiceLanguageSync({ language: "en" }));

    await vi.waitFor(() => {
      expect(getSpeechConfig().voiceURI).toBe("en-default");
    });
  });

  test("prefers the language's likely region over the browser default flag", async () => {
    stubLanguages(["en-US"]);
    vi.spyOn(speechSynthesis, "getVoices").mockReturnValue([
      makeVoice("fr-CA", "fr-ca-default", true),
      makeVoice("fr-FR", "fr-fr-voice"),
    ]);
    speechSynthesis.dispatchEvent(new Event("voiceschanged"));

    await renderHook(() => useVoiceLanguageSync({ language: "fr" }));

    await vi.waitFor(() => {
      expect(getSpeechConfig().voiceURI).toBe("fr-fr-voice");
    });
  });

  test("prefers the user's OS region over the language's likely region", async () => {
    stubLanguages(["fr-CA"]);
    vi.spyOn(speechSynthesis, "getVoices").mockReturnValue([
      makeVoice("fr-FR", "fr-fr-voice"),
      makeVoice("fr-CA", "fr-ca-voice"),
    ]);
    speechSynthesis.dispatchEvent(new Event("voiceschanged"));

    await renderHook(() => useVoiceLanguageSync({ language: "fr" }));

    await vi.waitFor(() => {
      expect(getSpeechConfig().voiceURI).toBe("fr-ca-voice");
    });
  });

  test("skips a region-less preferred locale and uses the next one for the language", async () => {
    stubLanguages(["fr", "fr-CA"]);
    vi.spyOn(speechSynthesis, "getVoices").mockReturnValue([
      makeVoice("fr-FR", "fr-fr-voice"),
      makeVoice("fr-CA", "fr-ca-voice"),
    ]);
    speechSynthesis.dispatchEvent(new Event("voiceschanged"));

    await renderHook(() => useVoiceLanguageSync({ language: "fr" }));

    await vi.waitFor(() => {
      expect(getSpeechConfig().voiceURI).toBe("fr-ca-voice");
    });
  });

  test("falls back to the default voice when no voice matches the likely region", async () => {
    stubLanguages(["en-US"]);
    vi.spyOn(speechSynthesis, "getVoices").mockReturnValue([
      makeVoice("fr-CA", "fr-ca-voice"),
      makeVoice("fr-BE", "fr-be-default", true),
    ]);
    speechSynthesis.dispatchEvent(new Event("voiceschanged"));

    await renderHook(() => useVoiceLanguageSync({ language: "fr" }));

    await vi.waitFor(() => {
      expect(getSpeechConfig().voiceURI).toBe("fr-be-default");
    });
  });
});
