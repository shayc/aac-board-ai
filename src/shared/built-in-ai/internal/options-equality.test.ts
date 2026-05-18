import { describe, expect, test } from "vitest";
import { shallowEqualOptions } from "./options-equality.ts";

describe("shallowEqualOptions", () => {
  test("both undefined → true", () => {
    expect(shallowEqualOptions(undefined, undefined)).toBe(true);
  });

  test("one undefined, the other defined → false", () => {
    expect(shallowEqualOptions(undefined, {})).toBe(false);
    expect(shallowEqualOptions({}, undefined)).toBe(false);
  });

  test("same reference → true", () => {
    const ref = { a: 1 };
    expect(shallowEqualOptions(ref, ref)).toBe(true);
  });

  test("same keys and values → true", () => {
    expect(shallowEqualOptions({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
  });

  test("different key counts → false", () => {
    expect(shallowEqualOptions({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  test("same keys, one value differs → false", () => {
    expect(shallowEqualOptions({ a: 1 }, { a: 2 })).toBe(false);
  });

  test("NaN values on both sides → true (Object.is semantics)", () => {
    expect(shallowEqualOptions({ a: NaN }, { a: NaN })).toBe(true);
  });

  // Pinning this: equality is SHALLOW, so an array option re-created each
  // render with the same contents is treated as *different*. Hooks like
  // useTranslator/useSummarizer will re-init unless callers memoize the
  // array — this test guards against accidentally adding deep equality.
  test("arrays with same contents but different identity → false", () => {
    expect(
      shallowEqualOptions({ langs: ["en", "fr"] }, { langs: ["en", "fr"] }),
    ).toBe(false);
  });

  test("arrays with the same identity → true", () => {
    const langs = ["en", "fr"];
    expect(shallowEqualOptions({ langs }, { langs })).toBe(true);
  });
});
