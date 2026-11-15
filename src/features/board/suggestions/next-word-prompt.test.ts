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

  test("constrains answers to the message completed with a board word, except the word just tapped", () => {
    expect(nextWordConstraint(VOCABULARY, "I want to")).toMatchObject({
      properties: {
        sentences: {
          items: {
            enum: [
              "I want to I",
              "I want to want",
              "I want to eat",
              "I want to more",
            ],
          },
        },
      },
    });
  });

  test("lets the model answer with one to three sentences", () => {
    expect(nextWordConstraint(VOCABULARY, "I")).toMatchObject({
      properties: { sentences: { minItems: 1, maxItems: 3 } },
    });
  });

  test("asks for no more sentences than the board has words", () => {
    expect(nextWordConstraint(["yes", "no"], "I")).toMatchObject({
      properties: { sentences: { maxItems: 2 } },
    });
  });

  test("keeps the first three distinct board words that complete the message", () => {
    const response =
      '{"sentences":["I want eat","I want eat","I want fly","I want more","I want to","I want I"]}';

    expect(parseNextWords(response, VOCABULARY, "I want")).toEqual([
      "eat",
      "more",
      "to",
    ]);
  });

  test("drops sentences that don't continue the message", () => {
    const response = '{"sentences":["you want eat","I want more"]}';

    expect(parseNextWords(response, VOCABULARY, "I want")).toEqual(["more"]);
  });
});
