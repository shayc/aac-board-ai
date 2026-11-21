import { describe, expect, test } from "vitest";
import { parseMessagePreferences } from "./message-preferences-store";

describe("parseMessagePreferences", () => {
  test("plays symbols, shows images, highlights while playing, and clears after playing when absent", () => {
    expect(parseMessagePreferences(undefined)).toEqual({
      areImagesVisible: true,
      isHighlightingEnabled: true,
      shouldClearAfterPlayback: true,
      shouldPlayTiles: true,
    });
  });

  test("ignores non-boolean stored values", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: "no",
        isHighlightingEnabled: "yes",
        shouldClearAfterPlayback: 0,
        shouldPlayTiles: null,
      }),
    ).toEqual({
      areImagesVisible: true,
      isHighlightingEnabled: true,
      shouldClearAfterPlayback: true,
      shouldPlayTiles: true,
    });
  });

  test("keeps stored booleans", () => {
    expect(
      parseMessagePreferences({
        areImagesVisible: false,
        isHighlightingEnabled: false,
        shouldClearAfterPlayback: false,
        shouldPlayTiles: false,
      }),
    ).toEqual({
      areImagesVisible: false,
      isHighlightingEnabled: false,
      shouldClearAfterPlayback: false,
      shouldPlayTiles: false,
    });
  });
});
