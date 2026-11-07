import { describe, expect, test } from "vitest";
import { parsePlaybackPreferences } from "./playback-preferences-store";

describe("parsePlaybackPreferences", () => {
  test("enables message-part highlighting when absent", () => {
    expect(parsePlaybackPreferences(undefined).isHighlightingEnabled).toBe(
      true,
    );
  });

  test("ignores a non-boolean stored value", () => {
    expect(
      parsePlaybackPreferences({
        isHighlightingEnabled: "yes",
      }).isHighlightingEnabled,
    ).toBe(true);
  });

  test("keeps a stored boolean", () => {
    expect(
      parsePlaybackPreferences({
        isHighlightingEnabled: false,
      }).isHighlightingEnabled,
    ).toBe(false);
  });
});
