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

  test("deduplicates a trailing full stop while keeping the first phrasing", () => {
    expect(
      selectSuggestionPhrases("want eat", [
        "want eat.",
        "I want to eat.",
        "I want to eat",
        "I want to eat。",
        "I want to eat?",
      ]),
    ).toEqual(["I want to eat.", "I want to eat?"]);
  });

  test("deduplicates phrases that differ only by apostrophe style", () => {
    expect(
      selectSuggestionPhrases("I no you go", [
        "I know you're going.",
        "I know you’re going.",
        "I know youʼre going.",
      ]),
    ).toEqual(["I know you're going."]);
  });

  test.each(["．", "｡", "।"])(
    "deduplicates a trailing %s full stop",
    (fullStop) => {
      expect(
        selectSuggestionPhrases("want eat", [
          "I want to eat",
          `I want to eat${fullStop}`,
        ]),
      ).toEqual(["I want to eat"]);
    },
  );

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
