import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  parsePlaybackConfig,
  setHighlightActivePart,
  usePlaybackConfig,
} from "./playback-store";

describe("playback-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("parsePlaybackConfig", () => {
    test("defaults highlightActivePart to false when absent", () => {
      expect(parsePlaybackConfig(undefined).highlightActivePart).toBe(false);
    });

    test("ignores a non-boolean stored value", () => {
      expect(
        parsePlaybackConfig({ highlightActivePart: "yes" }).highlightActivePart,
      ).toBe(false);
    });

    test("keeps a stored boolean", () => {
      expect(
        parsePlaybackConfig({ highlightActivePart: true }).highlightActivePart,
      ).toBe(true);
    });
  });

  test("setHighlightActivePart updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() => usePlaybackConfig());

    setHighlightActivePart(true);
    await rerender();

    expect(result.current.highlightActivePart).toBe(true);
    await vi.waitFor(() =>
      expect(localStorage.getItem("playback-config")).toBe(
        JSON.stringify({ highlightActivePart: true }),
      ),
    );
  });
});
