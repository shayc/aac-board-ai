import { describe, expect, test } from "vitest";
import { parsePlaybackPreferences } from "./playback-preferences-store";

describe("playback-preferences-store", () => {
  describe("parsePlaybackPreferences", () => {
    test("disables message-part highlighting when absent", () => {
      expect(
        parsePlaybackPreferences(undefined).isPartHighlightingEnabled,
      ).toBe(false);
    });

    test("ignores a non-boolean stored value", () => {
      expect(
        parsePlaybackPreferences({
          isPartHighlightingEnabled: "yes",
        }).isPartHighlightingEnabled,
      ).toBe(false);
    });

    test("keeps a stored boolean", () => {
      expect(
        parsePlaybackPreferences({
          isPartHighlightingEnabled: true,
        }).isPartHighlightingEnabled,
      ).toBe(true);
    });
  });
});
