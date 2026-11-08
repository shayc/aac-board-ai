import { describe, expect, test } from "vitest";
import { parseTilePreferences } from "./tile-preferences-store";

const DEFAULTS = {
  tileSaturation: 1,
  areTileBordersVisible: false,
  tileLabelPlacement: "top",
};

describe("parseTilePreferences", () => {
  test("uses defaults when nothing is stored", () => {
    expect(parseTilePreferences(undefined)).toEqual(DEFAULTS);
  });

  test("keeps valid stored values", () => {
    const stored = {
      tileSaturation: 0.4,
      areTileBordersVisible: true,
      tileLabelPlacement: "hidden",
    };

    expect(parseTilePreferences(stored)).toEqual(stored);
  });

  test.each([
    { tileSaturation: "high" },
    { tileSaturation: NaN },
    { areTileBordersVisible: "no" },
    { areTileBordersVisible: 0 },
    { tileLabelPlacement: "center" },
  ])("falls back to the default for an invalid stored value %j", (stored) => {
    expect(parseTilePreferences(stored)).toEqual(DEFAULTS);
  });

  test.each([
    { tileSaturation: -0.5, expected: 0 },
    { tileSaturation: 5, expected: 1 },
  ])(
    "clamps tileSaturation $tileSaturation into range",
    ({ tileSaturation, expected }) => {
      expect(parseTilePreferences({ tileSaturation }).tileSaturation).toBe(
        expected,
      );
    },
  );
});
