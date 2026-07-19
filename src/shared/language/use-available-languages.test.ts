import { stubVoices } from "@shared/testing/stub-speech";
import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useAvailableLanguages } from "./use-available-languages";

describe("useAvailableLanguages", () => {
  test("includes translated UI languages without installed voices", async () => {
    stubVoices([]);

    const { result } = await renderHook(() => useAvailableLanguages());

    expect(result.current).toEqual(
      expect.arrayContaining([
        { code: "en", name: "English" },
        { code: "fr", name: "français" },
      ]),
    );
  });

  test("includes voice languages regardless of Translator support", async () => {
    stubVoices([
      { voiceURI: "catalan", name: "Catalan", lang: "ca-ES" },
      { voiceURI: "malay", name: "Malay", lang: "ms-MY" },
    ]);

    const { result } = await renderHook(() => useAvailableLanguages());

    expect(result.current).toEqual(
      expect.arrayContaining([
        { code: "ca", name: "català" },
        { code: "ms", name: "Melayu" },
      ]),
    );
  });
});
