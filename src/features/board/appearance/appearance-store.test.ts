import { describe, expect, test } from "vitest";
import { parseBoardAppearanceConfig } from "./appearance-store";

describe("appearance-store", () => {
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

    test("keeps a stored areTileBordersVisible value of true", () => {
      expect(
        parseBoardAppearanceConfig({ areTileBordersVisible: true })
          .areTileBordersVisible,
      ).toBe(true);
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
});
