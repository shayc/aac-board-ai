import { describe, expect, test } from "vitest";
import { buildProgressKey } from "./progress-store";

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

  // Keys are sorted before stringifying so the same logical options never
  // shard the progress store across distinct entries based on insertion order.
  test("is order-independent across differently-ordered option objects", () => {
    const a = buildProgressKey("Translator", {
      sourceLanguage: "en",
      targetLanguage: "fr",
    });
    const b = buildProgressKey("Translator", {
      targetLanguage: "fr",
      sourceLanguage: "en",
    });
    expect(a).toBe(b);
  });
});
