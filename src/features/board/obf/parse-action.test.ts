import { describe, expect, test } from "vitest";
import { parseAction } from "./parse-action";

describe("parseAction", () => {
  test.each([
    [":space", { kind: "space" }],
    [":backspace", { kind: "backspace" }],
    [":clear", { kind: "clear" }],
    [":home", { kind: "home" }],
    [":speak", { kind: "speak" }],
  ] as const)("parses %s", (raw, expected) => {
    expect(parseAction(raw)).toEqual(expected);
  });

  test("parses +text as a spell action", () => {
    expect(parseAction("+ing")).toEqual({ kind: "spell", text: "ing" });
  });

  test("trims whitespace inside spell text", () => {
    expect(parseAction("+  ing  ")).toEqual({ kind: "spell", text: "ing" });
  });

  test("allows empty spell text", () => {
    expect(parseAction("+")).toEqual({ kind: "spell", text: "" });
  });

  test("returns null for unknown colon actions", () => {
    expect(parseAction(":unknown")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseAction("")).toBeNull();
  });

  test("returns null for arbitrary text", () => {
    expect(parseAction("hello")).toBeNull();
  });
});
