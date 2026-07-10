import { describe, expect, it } from "vitest";
import { sanitizeColor } from "./css-color";

describe("sanitizeColor", () => {
  it.each([
    "#ff0000",
    "rgb(0 0 0)",
    "rgba(0, 0, 0, 0.5)",
    "red",
    "oklch(0.7 0.1 200)",
    "transparent",
  ])("passes through valid color %s", (color) => {
    expect(sanitizeColor(color)).toBe(color);
  });

  it("rejects a CSS breakout payload", () => {
    expect(
      sanitizeColor("x); } a { background-image: url(https://evil.example) }"),
    ).toBeUndefined();
  });

  it.each(["", "not-a-color", "red; background: url(x)"])(
    "rejects invalid value %s",
    (color) => {
      expect(sanitizeColor(color)).toBeUndefined();
    },
  );

  it("returns undefined for undefined input", () => {
    expect(sanitizeColor(undefined)).toBeUndefined();
  });
});
