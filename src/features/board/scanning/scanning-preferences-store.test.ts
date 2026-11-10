import { describe, expect, test } from "vitest";
import { parseScanningPreferences } from "./scanning-preferences-store";

const DEFAULTS = {
  isEnabled: false,
  method: "auto",
  intervalMs: 1200,
};

describe("parseScanningPreferences", () => {
  test("uses defaults when nothing is stored", () => {
    expect(parseScanningPreferences(undefined)).toEqual(DEFAULTS);
  });

  test.each([null, 800, "step", [true]])(
    "uses defaults when the stored value %j is not an object",
    (stored) => {
      expect(parseScanningPreferences(stored)).toEqual(DEFAULTS);
    },
  );

  test("keeps valid stored values", () => {
    const stored = { isEnabled: true, method: "step", intervalMs: 800 };

    expect(parseScanningPreferences(stored)).toEqual(stored);
  });

  test.each([
    { isEnabled: "yes" },
    { isEnabled: 1 },
    { method: "dwell" },
    { method: 2 },
    { intervalMs: "fast" },
    { intervalMs: NaN },
  ])("falls back to the default for an invalid stored value %j", (stored) => {
    expect(parseScanningPreferences(stored)).toEqual(DEFAULTS);
  });

  test.each([
    { intervalMs: 50, expected: 500 },
    { intervalMs: 60_000, expected: 5000 },
  ])(
    "clamps the scan interval $intervalMs into range",
    ({ intervalMs, expected }) => {
      expect(parseScanningPreferences({ intervalMs }).intervalMs).toBe(
        expected,
      );
    },
  );
});
