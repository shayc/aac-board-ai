import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  parseTileColorConfig,
  setTileBorderVisible,
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

    test("defaults borderVisible to true when absent", () => {
      expect(parseTileColorConfig(undefined).borderVisible).toBe(true);
    });

    test("ignores a non-boolean stored borderVisible value", () => {
      expect(parseTileColorConfig({ borderVisible: "no" }).borderVisible).toBe(
        true,
      );
      expect(parseTileColorConfig({ borderVisible: 0 }).borderVisible).toBe(
        true,
      );
    });

    test("keeps a stored borderVisible value of false", () => {
      expect(parseTileColorConfig({ borderVisible: false }).borderVisible).toBe(
        false,
      );
    });

    test("keeps other fields when only borderVisible is stored", () => {
      expect(parseTileColorConfig({ borderVisible: false }).saturation).toBe(1);
    });
  });

  test("setTileSaturation updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() => useTileColorConfig());

    setTileSaturation(0.4);
    await rerender();

    expect(result.current.saturation).toBe(0.4);
    await vi.waitFor(() =>
      expect(localStorage.getItem("tile-color-config")).toBe(
        JSON.stringify({ saturation: 0.4, borderVisible: true }),
      ),
    );
  });

  test("setTileBorderVisible updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() => useTileColorConfig());

    setTileBorderVisible(false);
    await rerender();

    expect(result.current.borderVisible).toBe(false);
    await vi.waitFor(() =>
      expect(localStorage.getItem("tile-color-config")).toBe(
        JSON.stringify({ saturation: 1, borderVisible: false }),
      ),
    );
  });
});
