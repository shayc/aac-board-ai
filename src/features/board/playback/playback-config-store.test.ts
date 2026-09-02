import { describe, expect, test } from "vitest";
import { parseBoardPlaybackConfig } from "./playback-config-store";

describe("playback-config-store", () => {
  describe("parseBoardPlaybackConfig", () => {
    test("disables message-part highlighting when absent", () => {
      expect(
        parseBoardPlaybackConfig(undefined).isMessagePartHighlightingEnabled,
      ).toBe(false);
    });

    test("ignores a non-boolean stored value", () => {
      expect(
        parseBoardPlaybackConfig({
          isMessagePartHighlightingEnabled: "yes",
        }).isMessagePartHighlightingEnabled,
      ).toBe(false);
    });

    test("keeps a stored boolean", () => {
      expect(
        parseBoardPlaybackConfig({
          isMessagePartHighlightingEnabled: true,
        }).isMessagePartHighlightingEnabled,
      ).toBe(true);
    });
  });
});
