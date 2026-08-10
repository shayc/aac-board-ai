import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  parseBoardPlaybackConfig,
  setMessagePartHighlightingEnabled,
  useBoardPlaybackConfig,
} from "./playback-config-store";

describe("playback-config-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

  test("updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() =>
      useBoardPlaybackConfig(),
    );

    setMessagePartHighlightingEnabled(true);
    await rerender();

    expect(result.current.isMessagePartHighlightingEnabled).toBe(true);
    await vi.waitFor(() =>
      expect(localStorage.getItem("board-playback")).toBe(
        JSON.stringify({ isMessagePartHighlightingEnabled: true }),
      ),
    );
  });
});
