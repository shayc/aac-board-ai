import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { getSpeechConfig, setVoiceURI } from "./speech-store";
import { useVoiceLanguageSync } from "./use-voice-language-sync";

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
});
