import { describe, expect, test } from "vitest";
import { parsePlaybackPreferences } from "./playback-preferences-store";

describe("parsePlaybackPreferences", () => {
  test("disables message-part highlighting when absent", () => {
    expect(parsePlaybackPreferences(undefined).isHighlightingEnabled).toBe(
      false,
    );
  });

  test("ignores a non-boolean stored value", () => {
    expect(
      parsePlaybackPreferences({
        isHighlightingEnabled: "yes",
      }).isHighlightingEnabled,
    ).toBe(false);
  });

  test("keeps a stored boolean", () => {
    expect(
      parsePlaybackPreferences({
        isHighlightingEnabled: true,
      }).isHighlightingEnabled,
    ).toBe(true);
  });
});
