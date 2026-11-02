import { describe, expect, test } from "vitest";
import { parseAppearancePreferences } from "./appearance-store";

describe("appearance-store", () => {
  describe("parseAppearancePreferences", () => {
    test("defaults tileSaturation to 1 when absent", () => {
      expect(parseAppearancePreferences(undefined).tileSaturation).toBe(1);
    });

    test("ignores a non-number stored tileSaturation", () => {
      expect(
        parseAppearancePreferences({ tileSaturation: "high" }).tileSaturation,
      ).toBe(1);
    });

    test("ignores a non-finite stored tileSaturation", () => {
      expect(
        parseAppearancePreferences({ tileSaturation: NaN }).tileSaturation,
      ).toBe(1);
    });

    test("clamps tileSaturation below the minimum", () => {
      expect(
        parseAppearancePreferences({ tileSaturation: -0.5 }).tileSaturation,
      ).toBe(0);
    });

    test("clamps tileSaturation above the maximum", () => {
      expect(
        parseAppearancePreferences({ tileSaturation: 5 }).tileSaturation,
      ).toBe(1);
    });

    test("keeps an in-range tileSaturation", () => {
      expect(
        parseAppearancePreferences({ tileSaturation: 0.4 }).tileSaturation,
      ).toBe(0.4);
    });

    test("defaults areTileBordersVisible to false when absent", () => {
      expect(parseAppearancePreferences(undefined).areTileBordersVisible).toBe(
        false,
      );
    });

    test("ignores a non-boolean stored areTileBordersVisible", () => {
      expect(
        parseAppearancePreferences({ areTileBordersVisible: "no" })
          .areTileBordersVisible,
      ).toBe(false);
      expect(
        parseAppearancePreferences({ areTileBordersVisible: 0 })
          .areTileBordersVisible,
      ).toBe(false);
    });

    test("keeps a stored areTileBordersVisible value of true", () => {
      expect(
        parseAppearancePreferences({ areTileBordersVisible: true })
          .areTileBordersVisible,
      ).toBe(true);
    });

    test("keeps other fields when only areTileBordersVisible is stored", () => {
      expect(
        parseAppearancePreferences({ areTileBordersVisible: false })
          .tileSaturation,
      ).toBe(1);
    });

    test("defaults tileLabelPlacement to top when absent", () => {
      expect(parseAppearancePreferences(undefined).tileLabelPlacement).toBe(
        "top",
      );
    });

    test("ignores an unsupported stored tileLabelPlacement", () => {
      expect(
        parseAppearancePreferences({ tileLabelPlacement: "center" })
          .tileLabelPlacement,
      ).toBe("top");
    });

    test.each(["top", "bottom", "hidden"] as const)(
      "keeps a supported tileLabelPlacement of %s",
      (tileLabelPlacement) => {
        expect(
          parseAppearancePreferences({ tileLabelPlacement }).tileLabelPlacement,
        ).toBe(tileLabelPlacement);
      },
    );
  });
});
