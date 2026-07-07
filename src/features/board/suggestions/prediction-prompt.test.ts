import { describe, expect, test } from "vitest";
import {
  buildPredictionPrompt,
  PREDICTION_SYSTEM_PROMPT,
} from "./prediction-prompt";

describe("PREDICTION_SYSTEM_PROMPT", () => {
  test("instructs the model to predict, not complete, the sentence", () => {
    expect(PREDICTION_SYSTEM_PROMPT).toContain("communication board");
    expect(PREDICTION_SYSTEM_PROMPT).toMatch(/never complete/i);
  });
});

describe("buildPredictionPrompt", () => {
  test("includes the board words and the sentence so far", () => {
    const prompt = buildPredictionPrompt("I want", ["eat", "drink", "more"]);

    expect(prompt).toContain("Board words: eat, drink, more");
    expect(prompt).toContain("Sentence so far: I want");
    expect(prompt).toContain("Next 1 to 3 words:");
  });

  test("trims the message text", () => {
    const prompt = buildPredictionPrompt("  I want  ", ["eat"]);

    expect(prompt).toContain("Sentence so far: I want\n");
  });
});
