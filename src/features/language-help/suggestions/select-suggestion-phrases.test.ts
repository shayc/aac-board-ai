import { describe, expect, test } from "vitest";
import { selectSuggestionPhrases } from "./select-suggestion-phrases";

describe("selectSuggestionPhrases", () => {
  test("drops duplicates and the original text regardless of case and whitespace", () => {
    expect(
      selectSuggestionPhrases("want eat", [
        "I want to eat.",
        "I would like to eat.",
        "I want to eat.",
        "  I WANT TO EAT.  ",
        "want eat",
        "  WANT EAT  ",
      ]),
    ).toEqual(["I want to eat.", "I would like to eat."]);
  });

  test("ignores empty candidate slots", () => {
    expect(
      selectSuggestionPhrases("want eat", [undefined, "I want to eat."]),
    ).toEqual(["I want to eat."]);
  });

  test("filters candidates with underscored tokens or double quotes", () => {
    expect(
      selectSuggestionPhrases("seed", [
        "raw_token",
        'he said "hi"',
        "looks good",
      ]),
    ).toEqual(["looks good"]);
  });
});
