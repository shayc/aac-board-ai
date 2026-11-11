import { describe, expect, test } from "vitest";
import { parseTilePreferences } from "./tile-preferences-store";

const DEFAULTS = {
  saturation: 1,
  areBordersVisible: false,
  labelPlacement: "top",
};

describe("parseTilePreferences", () => {
  test("uses defaults when nothing is stored", () => {
    expect(parseTilePreferences(undefined)).toEqual(DEFAULTS);
  });

  test.each([null, 0.4, "hidden", [true]])(
    "uses defaults when the stored value %j is not an object",
    (stored) => {
      expect(parseTilePreferences(stored)).toEqual(DEFAULTS);
    },
  );

  test("keeps valid stored values", () => {
    const stored = {
      saturation: 0.4,
      areBordersVisible: true,
      labelPlacement: "hidden",
    };

    expect(parseTilePreferences(stored)).toEqual(stored);
  });

  test.each([
    { saturation: "high" },
    { saturation: NaN },
    { areBordersVisible: "no" },
    { areBordersVisible: 0 },
    { labelPlacement: "center" },
  ])("falls back to the default for an invalid stored value %j", (stored) => {
    expect(parseTilePreferences(stored)).toEqual(DEFAULTS);
  });

  test.each([
    { saturation: -0.5, expected: 0 },
    { saturation: 5, expected: 1 },
  ])("clamps saturation $saturation into range", ({ saturation, expected }) => {
    expect(parseTilePreferences({ saturation }).saturation).toBe(expected);
  });
});
