import { describe, expect, test } from "vitest";
import { parseSuggestionPreferences } from "./suggestion-preferences-store";

describe("suggestion-preferences-store", () => {
  describe("parseSuggestionPreferences", () => {
    test("defaults custom instructions to an empty string", () => {
      expect(parseSuggestionPreferences(undefined).customInstructions).toBe("");
    });

    test("ignores non-string custom instructions", () => {
      expect(
        parseSuggestionPreferences({ customInstructions: true })
          .customInstructions,
      ).toBe("");
    });

    test("keeps stored custom instructions", () => {
      expect(
        parseSuggestionPreferences({ customInstructions: "Be concise" })
          .customInstructions,
      ).toBe("Be concise");
    });
  });
});
