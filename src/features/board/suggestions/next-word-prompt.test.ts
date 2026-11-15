import { describe, expect, test } from "vitest";
import {
  nextWordConstraint,
  nextWordInitialPrompts,
  nextWordPrompt,
  parseNextWords,
} from "./next-word-prompt";

const VOCABULARY = ["I", "want", "to", "eat", "more"];

describe("next word prompt", () => {
  test("lists the board's words once, in the session prefix", () => {
    const [system] = nextWordInitialPrompts(VOCABULARY);

    expect(system.content).toContain(
      "Words on the board: I, want, to, eat, more",
    );
  });

  test("asks for the word that fills the blank after the message", () => {
    expect(nextWordPrompt("I want")).toBe('Sentence: "I want ___"');
  });

  test("constrains answers to the board's words except the word just tapped", () => {
    expect(nextWordConstraint(VOCABULARY, "I want to")).toMatchObject({
      properties: {
        words: { items: { enum: ["I", "want", "eat", "more"] }, minItems: 3 },
      },
    });
  });

  test("asks for fewer words when the board has fewer than three", () => {
    expect(nextWordConstraint(["yes", "no"], "I")).toMatchObject({
      properties: { words: { minItems: 2, maxItems: 2 } },
    });
  });

  test("keeps the first three distinct board words of the response", () => {
    const response = '{"words":["eat","eat","fly","more","to"]}';

    expect(parseNextWords(response, VOCABULARY)).toEqual(["eat", "more", "to"]);
  });
});
