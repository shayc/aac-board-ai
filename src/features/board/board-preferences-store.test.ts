import { describe, expect, test } from "vitest";
import { parseBoardPreferences } from "./board-preferences-store";

describe("board-preferences-store", () => {
  describe("parseBoardPreferences", () => {
    test("defaults tileSaturation to 1 when absent", () => {
      expect(parseBoardPreferences(undefined).tileSaturation).toBe(1);
    });

    test("ignores a non-number stored tileSaturation", () => {
      expect(
        parseBoardPreferences({ tileSaturation: "high" }).tileSaturation,
      ).toBe(1);
    });

    test("ignores a non-finite stored tileSaturation", () => {
      expect(
        parseBoardPreferences({ tileSaturation: NaN }).tileSaturation,
      ).toBe(1);
    });

    test("clamps tileSaturation below the minimum", () => {
      expect(
        parseBoardPreferences({ tileSaturation: -0.5 }).tileSaturation,
      ).toBe(0);
    });

    test("clamps tileSaturation above the maximum", () => {
      expect(parseBoardPreferences({ tileSaturation: 5 }).tileSaturation).toBe(
        1,
      );
    });

    test("keeps an in-range tileSaturation", () => {
      expect(
        parseBoardPreferences({ tileSaturation: 0.4 }).tileSaturation,
      ).toBe(0.4);
    });

    test("defaults tileBrightness to 1 when absent", () => {
      expect(parseBoardPreferences(undefined).tileBrightness).toBe(1);
    });

    test("clamps tileBrightness below the minimum", () => {
      expect(parseBoardPreferences({ tileBrightness: 0 }).tileBrightness).toBe(
        0.5,
      );
    });

    test("clamps tileBrightness above the maximum", () => {
      expect(parseBoardPreferences({ tileBrightness: 2 }).tileBrightness).toBe(
        1,
      );
    });

    test("keeps an in-range tileBrightness", () => {
      expect(
        parseBoardPreferences({ tileBrightness: 0.7 }).tileBrightness,
      ).toBe(0.7);
    });

    test("defaults areTileBordersVisible to false when absent", () => {
      expect(parseBoardPreferences(undefined).areTileBordersVisible).toBe(
        false,
      );
    });

    test("ignores a non-boolean stored areTileBordersVisible", () => {
      expect(
        parseBoardPreferences({ areTileBordersVisible: "no" })
          .areTileBordersVisible,
      ).toBe(false);
      expect(
        parseBoardPreferences({ areTileBordersVisible: 0 })
          .areTileBordersVisible,
      ).toBe(false);
    });

    test("keeps a stored areTileBordersVisible value of true", () => {
      expect(
        parseBoardPreferences({ areTileBordersVisible: true })
          .areTileBordersVisible,
      ).toBe(true);
    });

    test("keeps other fields when only areTileBordersVisible is stored", () => {
      expect(
        parseBoardPreferences({ areTileBordersVisible: false }).tileSaturation,
      ).toBe(1);
    });

    test("defaults tileLabelPlacement to top when absent", () => {
      expect(parseBoardPreferences(undefined).tileLabelPlacement).toBe("top");
    });

    test("ignores an unsupported stored tileLabelPlacement", () => {
      expect(
        parseBoardPreferences({ tileLabelPlacement: "center" })
          .tileLabelPlacement,
      ).toBe("top");
    });

    test.each(["top", "bottom", "hidden"] as const)(
      "keeps a supported tileLabelPlacement of %s",
      (tileLabelPlacement) => {
        expect(
          parseBoardPreferences({ tileLabelPlacement }).tileLabelPlacement,
        ).toBe(tileLabelPlacement);
      },
    );
  });
});
