import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  parseTileColorConfig,
  setTileSaturation,
  useTileColorConfig,
} from "./tile-color-store";

describe("tile-color-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("parseTileColorConfig", () => {
    test("defaults saturation to 1 when absent", () => {
      expect(parseTileColorConfig(undefined).saturation).toBe(1);
    });

    test("ignores a non-number stored value", () => {
      expect(parseTileColorConfig({ saturation: "high" }).saturation).toBe(1);
    });

    test("ignores a non-finite stored value", () => {
      expect(parseTileColorConfig({ saturation: NaN }).saturation).toBe(1);
    });

    test("clamps a value below the minimum", () => {
      expect(parseTileColorConfig({ saturation: -0.5 }).saturation).toBe(0);
    });

    test("clamps a value above the maximum", () => {
      expect(parseTileColorConfig({ saturation: 5 }).saturation).toBe(1);
    });

    test("keeps an in-range stored value", () => {
      expect(parseTileColorConfig({ saturation: 0.4 }).saturation).toBe(0.4);
    });
  });

  test("setTileSaturation updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() => useTileColorConfig());

    setTileSaturation(0.4);
    await rerender();

    expect(result.current.saturation).toBe(0.4);
    await vi.waitFor(() =>
      expect(localStorage.getItem("tile-color-config")).toBe(
        JSON.stringify({ saturation: 0.4 }),
      ),
    );
  });
});
