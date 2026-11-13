import { describe, expect, test } from "vitest";
import { parseMessagePreferences } from "./message-preferences-store";

describe("parseMessagePreferences", () => {
  test("shows images, highlights while speaking, and clears after speaking when absent", () => {
    expect(parseMessagePreferences(undefined)).toEqual({
      areImagesVisible: true,
      isHighlightingEnabled: true,
      clearsAfterSpeaking: true,
    });
  });

  test("ignores non-boolean stored values", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: "no",
        isHighlightingEnabled: "yes",
        clearsAfterSpeaking: 0,
      }),
    ).toEqual({
      areImagesVisible: true,
      isHighlightingEnabled: true,
      clearsAfterSpeaking: true,
    });
  });

  test("keeps stored booleans", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: false,
        isHighlightingEnabled: false,
        clearsAfterSpeaking: false,
      }),
    ).toEqual({
      areImagesVisible: false,
      isHighlightingEnabled: false,
      clearsAfterSpeaking: false,
    });
  });
});
