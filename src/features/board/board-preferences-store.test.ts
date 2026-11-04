import { describe, expect, test } from "vitest";
import { parseBoardPreferences } from "./board-preferences-store";

const DEFAULTS = {
  tileSaturation: 1,
  areTileBordersVisible: false,
  tileLabelPlacement: "top",
};

describe("parseBoardPreferences", () => {
  test("uses defaults when nothing is stored", () => {
    expect(parseBoardPreferences(undefined)).toEqual(DEFAULTS);
  });

  test("keeps valid stored values", () => {
    const stored = {
      tileSaturation: 0.4,
      areTileBordersVisible: true,
      tileLabelPlacement: "hidden",
    };

    expect(parseBoardPreferences(stored)).toEqual(stored);
  });

  test.each([
    { tileSaturation: "high" },
    { tileSaturation: NaN },
    { areTileBordersVisible: "no" },
    { areTileBordersVisible: 0 },
    { tileLabelPlacement: "center" },
  ])("falls back to the default for an invalid stored value %j", (stored) => {
    expect(parseBoardPreferences(stored)).toEqual(DEFAULTS);
  });

  test.each([
    { tileSaturation: -0.5, expected: 0 },
    { tileSaturation: 5, expected: 1 },
  ])(
    "clamps tileSaturation $tileSaturation into range",
    ({ tileSaturation, expected }) => {
      expect(parseBoardPreferences({ tileSaturation }).tileSaturation).toBe(
        expected,
      );
    },
  );
});
