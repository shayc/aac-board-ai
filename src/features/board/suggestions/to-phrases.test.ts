import { describe, expect, test } from "vitest";
import { toPhrases } from "./to-phrases";

describe("toPhrases", () => {
  test("combines candidates, dropping duplicates and the original text", () => {
    expect(
      toPhrases("want eat", [
        "I want to eat.",
        "I would like to eat.",
        "I want to eat.",
        "want eat",
      ]),
    ).toEqual(["I want to eat.", "I would like to eat."]);
  });

  test("ignores empty candidate slots", () => {
    expect(toPhrases("want eat", [undefined, "I want to eat."])).toEqual([
      "I want to eat.",
    ]);
  });

  test("filters candidates with underscored tokens or double quotes", () => {
    expect(
      toPhrases("seed", ["raw_token", 'he said "hi"', "looks good"]),
    ).toEqual(["looks good"]);
  });
});
