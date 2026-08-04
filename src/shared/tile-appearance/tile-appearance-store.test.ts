import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  parseTileAppearanceConfig,
  setTileBorderVisible,
  setTileSaturation,
  useTileAppearanceConfig,
} from "./tile-appearance-store";

describe("tile-appearance-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("parseTileAppearanceConfig", () => {
    test("defaults saturation to 1 when absent", () => {
      expect(parseTileAppearanceConfig(undefined).saturation).toBe(1);
    });

    test("ignores a non-number stored value", () => {
      expect(parseTileAppearanceConfig({ saturation: "high" }).saturation).toBe(
        1,
      );
    });

    test("ignores a non-finite stored value", () => {
      expect(parseTileAppearanceConfig({ saturation: NaN }).saturation).toBe(1);
    });

    test("clamps a value below the minimum", () => {
      expect(parseTileAppearanceConfig({ saturation: -0.5 }).saturation).toBe(
        0,
      );
    });

    test("clamps a value above the maximum", () => {
      expect(parseTileAppearanceConfig({ saturation: 5 }).saturation).toBe(1);
    });

    test("keeps an in-range stored value", () => {
      expect(parseTileAppearanceConfig({ saturation: 0.4 }).saturation).toBe(
        0.4,
      );
    });

    test("defaults borderVisible to false when absent", () => {
      expect(parseTileAppearanceConfig(undefined).borderVisible).toBe(false);
    });

    test("ignores a non-boolean stored borderVisible value", () => {
      expect(
        parseTileAppearanceConfig({ borderVisible: "no" }).borderVisible,
      ).toBe(false);
      expect(
        parseTileAppearanceConfig({ borderVisible: 0 }).borderVisible,
      ).toBe(false);
    });

    test("keeps a stored borderVisible value of false", () => {
      expect(
        parseTileAppearanceConfig({ borderVisible: false }).borderVisible,
      ).toBe(false);
    });

    test("keeps other fields when only borderVisible is stored", () => {
      expect(
        parseTileAppearanceConfig({ borderVisible: false }).saturation,
      ).toBe(1);
    });
  });

  test("setTileSaturation updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() =>
      useTileAppearanceConfig(),
    );

    setTileSaturation(0.4);
    await rerender();

    expect(result.current.saturation).toBe(0.4);
    await vi.waitFor(() =>
      expect(localStorage.getItem("tile-color-config")).toBe(
        JSON.stringify({ saturation: 0.4, borderVisible: false }),
      ),
    );
  });

  test("setTileBorderVisible updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() =>
      useTileAppearanceConfig(),
    );

    setTileBorderVisible(true);
    await rerender();

    expect(result.current.borderVisible).toBe(true);
    await vi.waitFor(() =>
      expect(localStorage.getItem("tile-color-config")).toBe(
        JSON.stringify({ saturation: 1, borderVisible: true }),
      ),
    );
  });
});
