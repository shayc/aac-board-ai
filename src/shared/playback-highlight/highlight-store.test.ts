import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  parseHighlightConfig,
  setHighlightActivePart,
  useHighlightConfig,
} from "./highlight-store";

describe("highlight-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("parseHighlightConfig", () => {
    test("defaults highlightActivePart to false when absent", () => {
      expect(parseHighlightConfig(undefined).highlightActivePart).toBe(false);
    });

    test("ignores a non-boolean stored value", () => {
      expect(
        parseHighlightConfig({ highlightActivePart: "yes" })
          .highlightActivePart,
      ).toBe(false);
    });

    test("keeps a stored boolean", () => {
      expect(
        parseHighlightConfig({ highlightActivePart: true }).highlightActivePart,
      ).toBe(true);
    });
  });

  test("setHighlightActivePart updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() => useHighlightConfig());

    setHighlightActivePart(true);
    await rerender();

    expect(result.current.highlightActivePart).toBe(true);
    await vi.waitFor(() =>
      expect(localStorage.getItem("highlight-config")).toBe(
        JSON.stringify({ highlightActivePart: true }),
      ),
    );
  });
});
