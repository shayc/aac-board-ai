import { describe, expect, test } from "vitest";
import {
  continuationConstraint,
  continuationInitialPrompts,
  continuationPrompt,
  parseContinuations,
} from "./continuation-prompt";

const VOCABULARY = ["I", "want", "to", "eat", "more", "thank you"];

function sentencePattern(text: string): RegExp {
  const constraint = continuationConstraint(VOCABULARY, text) as {
    properties: { sentences: { items: { pattern: string } } };
  };

  return new RegExp(constraint.properties.sentences.items.pattern);
}

describe("continuation prompt", () => {
  test("lists the nearby words once, in the session prefix", () => {
    const [system] = continuationInitialPrompts(VOCABULARY);

    expect(system.content).toContain(
      "Words on the board: I, want, to, eat, more, thank you",
    );
  });

  test("asks for the words that fill the blank after the message", () => {
    expect(continuationPrompt("I want")).toBe('Sentence: "I want ___"');
  });

  test("constrains answers to the message followed by one to three nearby words", () => {
    const pattern = sentencePattern("I want");

    expect(pattern.test("I want to")).toBe(true);
    expect(pattern.test("I want to eat more")).toBe(true);
    expect(pattern.test("I want to eat more thank you")).toBe(false);
    expect(pattern.test("I want to fly")).toBe(false);
    expect(pattern.test("you want to eat")).toBe(false);
  });

  test("matches a message that holds punctuation literally", () => {
    expect(sentencePattern("what? (no)").test("what? (no) more")).toBe(true);
  });

  test("lets the model answer with one to three sentences", () => {
    expect(continuationConstraint(VOCABULARY, "I")).toMatchObject({
      properties: { sentences: { minItems: 1, maxItems: 3 } },
    });
  });

  test("keeps the distinct continuations that add two or three nearby words", () => {
    const response =
      '{"sentences":["I want to eat","I want to eat","I want more","I want to eat more"]}';

    expect(parseContinuations(response, VOCABULARY, "I want")).toEqual([
      ["to", "eat"],
      ["to", "eat", "more"],
    ]);
  });

  test("counts a label with a space in it as one word", () => {
    const response = '{"sentences":["I thank you","I want thank you"]}';

    expect(parseContinuations(response, VOCABULARY, "I")).toEqual([
      ["want", "thank you"],
    ]);
  });

  test("drops sentences that don't continue the message with nearby words", () => {
    const response =
      '{"sentences":["you want to eat","I want to fly","I want to eat"]}';

    expect(parseContinuations(response, VOCABULARY, "I want")).toEqual([
      ["to", "eat"],
    ]);
  });
});
