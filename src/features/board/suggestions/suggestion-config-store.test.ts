import { describe, expect, test } from "vitest";
import { parseBoardSuggestionConfig } from "./suggestion-config-store";

describe("suggestion-config-store", () => {
  describe("parseBoardSuggestionConfig", () => {
    test("defaults custom instructions to an empty string", () => {
      expect(parseBoardSuggestionConfig(undefined).customInstructions).toBe("");
    });

    test("ignores non-string custom instructions", () => {
      expect(
        parseBoardSuggestionConfig({ customInstructions: true })
          .customInstructions,
      ).toBe("");
    });

    test("keeps stored custom instructions", () => {
      expect(
        parseBoardSuggestionConfig({ customInstructions: "Be concise" })
          .customInstructions,
      ).toBe("Be concise");
    });
  });
});
