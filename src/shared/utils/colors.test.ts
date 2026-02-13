import { describe, expect, test } from "vitest";
import { getReadableTextColor } from "./colors";

describe("getReadableTextColor", () => {
  test("returns white for a dark background", () => {
    expect(getReadableTextColor("#000000")).toBe("#fff");
  });

  test("returns black for a light background", () => {
    expect(getReadableTextColor("#ffffff")).toBe("#000");
  });
});
