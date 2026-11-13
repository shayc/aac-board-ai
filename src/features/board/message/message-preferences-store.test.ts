import { describe, expect, test } from "vitest";
import { parseMessagePreferences } from "./message-preferences-store";

describe("parseMessagePreferences", () => {
  test("shows images, highlights while speaking, and starts a new message after speaking when absent", () => {
    expect(parseMessagePreferences(undefined)).toEqual({
      areImagesVisible: true,
      isHighlightingEnabled: true,
      startsNewMessageAfterSpeaking: true,
    });
  });

  test("ignores non-boolean stored values", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: "no",
        isHighlightingEnabled: "yes",
        startsNewMessageAfterSpeaking: 0,
      }),
    ).toEqual({
      areImagesVisible: true,
      isHighlightingEnabled: true,
      startsNewMessageAfterSpeaking: true,
    });
  });

  test("keeps stored booleans", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: false,
        isHighlightingEnabled: false,
        startsNewMessageAfterSpeaking: false,
      }),
    ).toEqual({
      areImagesVisible: false,
      isHighlightingEnabled: false,
      startsNewMessageAfterSpeaking: false,
    });
  });
});
