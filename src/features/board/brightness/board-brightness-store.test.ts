import { describe, expect, test } from "vitest";
import { parseBoardBrightness } from "./board-brightness-store";

describe("parseBoardBrightness", () => {
  test.each([undefined, null, "dim", NaN, { brightness: 0.8 }])(
    "uses full brightness when the stored value %j is not a number",
    (stored) => {
      expect(parseBoardBrightness(stored)).toBe(1);
    },
  );

  test("keeps a stored brightness within range", () => {
    expect(parseBoardBrightness(0.8)).toBe(0.8);
  });

  test.each([
    { stored: 0.1, expected: 0.7 },
    { stored: 5, expected: 1 },
  ])("clamps brightness $stored into range", ({ stored, expected }) => {
    expect(parseBoardBrightness(stored)).toBe(expected);
  });
});
