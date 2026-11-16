import { describe, expect, test } from "vitest";
import { normalizeAssetPath } from "./normalize-asset-path";

describe("normalizeAssetPath", () => {
  test.each([
    ["images/cat.png", "images/cat.png"],
    ["/images/cat.png", "images/cat.png"],
    ["images//cat.png", "images/cat.png"],
    ["images\\cat.png", "images/cat.png"],
    ["\\images\\\\cat.png", "images/cat.png"],
  ])("spells %j as %j", (rawPath, expected) => {
    expect(normalizeAssetPath(rawPath)).toBe(expected);
  });

  test.each(["", "/", "////", "\\"])(
    "returns an empty path when %j names no file",
    (rawPath) => {
      expect(normalizeAssetPath(rawPath)).toBe("");
    },
  );
});
