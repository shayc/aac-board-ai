import { describe, expect, test } from "vitest";
import { parseMessagePreferences } from "./message-preferences-store";

describe("parseMessagePreferences", () => {
  test("shows images, highlights while speaking, and auto-clears when absent", () => {
    expect(parseMessagePreferences(undefined)).toEqual({
      areImagesVisible: true,
      isHighlightingEnabled: true,
      isAutoClearEnabled: true,
    });
  });

  test("ignores non-boolean stored values", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: "no",
        isHighlightingEnabled: "yes",
        isAutoClearEnabled: 0,
      }),
    ).toEqual({
      areImagesVisible: true,
      isHighlightingEnabled: true,
      isAutoClearEnabled: true,
    });
  });

  test("keeps stored booleans", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: false,
        isHighlightingEnabled: false,
        isAutoClearEnabled: false,
      }),
    ).toEqual({
      areImagesVisible: false,
      isHighlightingEnabled: false,
      isAutoClearEnabled: false,
    });
  });
});
