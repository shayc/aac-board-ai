import { beforeEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  parsePlaybackSettings,
  setHighlightActivePart,
  usePlaybackSettings,
} from "./playback-settings";

describe("playback-settings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("parsePlaybackSettings", () => {
    test("defaults highlightActivePart to false when absent", () => {
      expect(parsePlaybackSettings(undefined).highlightActivePart).toBe(false);
    });

    test("ignores a non-boolean stored value", () => {
      expect(
        parsePlaybackSettings({ highlightActivePart: "yes" })
          .highlightActivePart,
      ).toBe(false);
    });

    test("keeps a stored boolean", () => {
      expect(
        parsePlaybackSettings({ highlightActivePart: true })
          .highlightActivePart,
      ).toBe(true);
    });
  });

  test("setHighlightActivePart updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() => usePlaybackSettings());

    setHighlightActivePart(true);
    await rerender();

    expect(result.current.highlightActivePart).toBe(true);
    expect(localStorage.getItem("playback-settings")).toBe(
      JSON.stringify({ highlightActivePart: true }),
    );
  });
});
