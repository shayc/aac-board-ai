import { describe, expect, test } from "vitest";
import { buildProgressKey } from "./progress-store.ts";

describe("buildProgressKey", () => {
  test("returns the bare name when options are empty or undefined", () => {
    expect(buildProgressKey("Summarizer", undefined)).toBe("Summarizer");
    expect(buildProgressKey("Summarizer", {})).toBe("Summarizer");
  });

  test("appends a JSON-stringified options suffix when present", () => {
    expect(
      buildProgressKey("Translator", {
        sourceLanguage: "en",
        targetLanguage: "fr",
      }),
    ).toBe('Translator:{"sourceLanguage":"en","targetLanguage":"fr"}');
  });
});
