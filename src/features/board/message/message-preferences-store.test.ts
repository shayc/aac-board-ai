import { describe, expect, test } from "vitest";
import { parseMessagePreferences } from "./message-preferences-store";

describe("parseMessagePreferences", () => {
  test("shows images and highlights while speaking when absent", () => {
    expect(parseMessagePreferences(undefined)).toEqual({
      areImagesVisible: true,
      isHighlightingEnabled: true,
    });
  });

  test("ignores non-boolean stored values", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: "no",
        isHighlightingEnabled: "yes",
      }),
    ).toEqual({ areImagesVisible: true, isHighlightingEnabled: true });
  });

  test("keeps stored booleans", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: false,
        isHighlightingEnabled: false,
      }),
    ).toEqual({ areImagesVisible: false, isHighlightingEnabled: false });
  });
});
