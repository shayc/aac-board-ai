import { describe, expect, test } from "vitest";
import { assertNever } from "./assert-never";

describe("assertNever", () => {
  test("throws with the stringified value", () => {
    expect(() => assertNever({ kind: "bogus" } as never)).toThrow(
      'Unhandled value: {"kind":"bogus"}',
    );
  });
});
