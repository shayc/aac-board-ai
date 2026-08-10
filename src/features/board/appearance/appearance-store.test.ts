import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  parseBoardAppearanceConfig,
  setTileBordersVisible,
  setTileLabelPlacement,
  setTileSaturation,
  useBoardAppearanceConfig,
} from "./appearance-store";

describe("appearance-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("parseBoardAppearanceConfig", () => {
    test("defaults tileSaturation to 1 when absent", () => {
      expect(parseBoardAppearanceConfig(undefined).tileSaturation).toBe(1);
    });

    test("ignores a non-number stored tileSaturation", () => {
      expect(
        parseBoardAppearanceConfig({ tileSaturation: "high" }).tileSaturation,
      ).toBe(1);
    });

    test("ignores a non-finite stored tileSaturation", () => {
      expect(
        parseBoardAppearanceConfig({ tileSaturation: NaN }).tileSaturation,
      ).toBe(1);
    });

    test("clamps tileSaturation below the minimum", () => {
      expect(
        parseBoardAppearanceConfig({ tileSaturation: -0.5 }).tileSaturation,
      ).toBe(0);
    });

    test("clamps tileSaturation above the maximum", () => {
      expect(
        parseBoardAppearanceConfig({ tileSaturation: 5 }).tileSaturation,
      ).toBe(1);
    });

    test("keeps an in-range tileSaturation", () => {
      expect(
        parseBoardAppearanceConfig({ tileSaturation: 0.4 }).tileSaturation,
      ).toBe(0.4);
    });

    test("defaults areTileBordersVisible to false when absent", () => {
      expect(parseBoardAppearanceConfig(undefined).areTileBordersVisible).toBe(
        false,
      );
    });

    test("ignores a non-boolean stored areTileBordersVisible", () => {
      expect(
        parseBoardAppearanceConfig({ areTileBordersVisible: "no" })
          .areTileBordersVisible,
      ).toBe(false);
      expect(
        parseBoardAppearanceConfig({ areTileBordersVisible: 0 })
          .areTileBordersVisible,
      ).toBe(false);
    });

    test("keeps a stored areTileBordersVisible value of false", () => {
      expect(
        parseBoardAppearanceConfig({ areTileBordersVisible: false })
          .areTileBordersVisible,
      ).toBe(false);
    });

    test("keeps other fields when only areTileBordersVisible is stored", () => {
      expect(
        parseBoardAppearanceConfig({ areTileBordersVisible: false })
          .tileSaturation,
      ).toBe(1);
    });

    test("defaults tileLabelPlacement to top when absent", () => {
      expect(parseBoardAppearanceConfig(undefined).tileLabelPlacement).toBe(
        "top",
      );
    });

    test("ignores an unsupported stored tileLabelPlacement", () => {
      expect(
        parseBoardAppearanceConfig({ tileLabelPlacement: "center" })
          .tileLabelPlacement,
      ).toBe("top");
    });

    test.each(["top", "bottom", "hidden"] as const)(
      "keeps a supported tileLabelPlacement of %s",
      (tileLabelPlacement) => {
        expect(
          parseBoardAppearanceConfig({ tileLabelPlacement }).tileLabelPlacement,
        ).toBe(tileLabelPlacement);
      },
    );
  });

  test("setTileSaturation updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() =>
      useBoardAppearanceConfig(),
    );

    setTileSaturation(0.4);
    await rerender();

    expect(result.current.tileSaturation).toBe(0.4);
    await vi.waitFor(() =>
      expect(localStorage.getItem("board-appearance")).toBe(
        JSON.stringify({
          tileSaturation: 0.4,
          areTileBordersVisible: false,
          tileLabelPlacement: "top",
        }),
      ),
    );
  });

  test("setTileBordersVisible updates and persists the snapshot", async () => {
    const { result, rerender } = await renderHook(() =>
      useBoardAppearanceConfig(),
    );

    setTileBordersVisible(true);
    await rerender();

    expect(result.current.areTileBordersVisible).toBe(true);
    await vi.waitFor(() =>
      expect(localStorage.getItem("board-appearance")).toBe(
        JSON.stringify({
          tileSaturation: 1,
          areTileBordersVisible: true,
          tileLabelPlacement: "top",
        }),
      ),
    );
  });

  test("setTileLabelPlacement updates and persists the snapshot", async () => {
    const { result, rerender } = await renderHook(() =>
      useBoardAppearanceConfig(),
    );

    setTileLabelPlacement("bottom");
    await rerender();

    expect(result.current.tileLabelPlacement).toBe("bottom");
    await vi.waitFor(() =>
      expect(localStorage.getItem("board-appearance")).toBe(
        JSON.stringify({
          tileSaturation: 1,
          areTileBordersVisible: false,
          tileLabelPlacement: "bottom",
        }),
      ),
    );
  });
});
