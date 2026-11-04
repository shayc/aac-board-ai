import { describe, expect, test } from "vitest";
import { sanitizeColor } from "./sanitize-color";

describe("sanitizeColor", () => {
  test.each([
    "#ff0000",
    "rgb(0 0 0)",
    "rgba(0, 0, 0, 0.5)",
    "red",
    "oklch(0.7 0.1 200)",
    "transparent",
  ])("passes through valid color %s", (color) => {
    expect(sanitizeColor(color)).toBe(color);
  });

  test("rejects a CSS breakout payload", () => {
    expect(
      sanitizeColor("x); } a { background-image: url(https://evil.example) }"),
    ).toBeUndefined();
  });

  test.each(["", "not-a-color", "red; background: url(x)"])(
    "rejects invalid color %j",
    (color) => {
      expect(sanitizeColor(color)).toBeUndefined();
    },
  );

  test("returns undefined for undefined input", () => {
    expect(sanitizeColor(undefined)).toBeUndefined();
  });
});
