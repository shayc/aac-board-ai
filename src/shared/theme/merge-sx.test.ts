import { describe, expect, test } from "vitest";
import { mergeSx } from "./merge-sx";

describe("mergeSx", () => {
  test("returns the base styles without an override", () => {
    const base = { width: 88 };

    expect(mergeSx(base, undefined)).toEqual([base]);
  });

  test("appends a single override", () => {
    const base = { width: 88 };
    const override = { opacity: 0.5 };

    expect(mergeSx(base, override)).toEqual([base, override]);
  });

  test("flattens an override array", () => {
    const base = { width: 88 };
    const overrides = [{ opacity: 0.5 }, false, { minWidth: 80 }] as const;

    expect(mergeSx(base, overrides)).toEqual([base, ...overrides]);
  });
});
