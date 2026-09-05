import { describe, expect, test } from "vitest";
import { parseAction } from "./parse-action";

describe("parseAction", () => {
  test.each([
    [":space", { kind: "space" }],
    [":backspace", { kind: "backspace" }],
    [":clear", { kind: "clear" }],
    [":home", { kind: "home" }],
    [":speak", { kind: "playMessage" }],
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

  test.each([":unknown", "", "hello"])(
    "returns null for invalid action %j",
    (raw) => {
      expect(parseAction(raw)).toBeNull();
    },
  );
});
