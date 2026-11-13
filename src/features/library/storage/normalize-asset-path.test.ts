import { describe, expect, test } from "vitest";
import { normalizeAssetPath } from "./normalize-asset-path";

describe("normalizeAssetPath", () => {
  test.each(["", "/", "////", "\\"])(
    "returns an empty path when %j names no file",
    (rawPath) => {
      expect(normalizeAssetPath(rawPath)).toBe("");
    },
  );
});
